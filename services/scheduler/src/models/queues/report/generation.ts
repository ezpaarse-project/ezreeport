import { randomUUID } from 'node:crypto';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import { GenerationQueueData, type GenerationQueueDataType } from '~common/types/queues';
import type { GenerationType } from '~common/types/generations';

const generationQueueName = 'ezreeport.report:queues';
const deadGenerationExchangeName = 'ezreeport.report:queues:dead';

const logger = appLogger.child({ scope: 'queues', queue: generationQueueName });

let channel: rabbitmq.Channel | undefined;

async function onDeadGeneration(c: rabbitmq.Channel, msg: rabbitmq.ConsumeMessage | null) {
  if (!msg) {
    return;
  }

  // Parse message
  const raw = JSON.parse(msg.content.toString());
  let data;
  try {
    data = await GenerationQueueData.parseAsync(raw);
  } catch (err) {
    logger.error({
      msg: 'Invalid data',
      data: process.env.NODE_ENV === 'production' ? undefined : raw,
      err,
    });
    c.nack(msg, undefined, false);
    return;
  }

  try {
    const event: GenerationType = {
      id: data.id,
      taskId: data.task.id,
      status: 'ABORTED',
      start: data.period.start,
      end: data.period.end,
      targets: data.targets,
      origin: data.origin,
      writeActivity: !!data.writeActivity,
      progress: null,
      took: null,
      reportId: '',
      createdAt: data.createdAt,
      updatedAt: new Date(),
      startedAt: null,
    };

    const buf = Buffer.from(JSON.stringify(event));
    c.publish('ezreeport.report:event', '', buf);
  } catch (err) {
    logger.error({ msg: 'Failed to send event', err });
  }
  c.ack(msg);
}

export async function initGenerationQueue(c: rabbitmq.Channel) {
  // queueGeneration will be called while begin unaware of
  // rabbitmq connection, so we need to store the channel
  // here
  channel = c;

  const { exchange: deadLetterExchange } = await c.assertExchange(
    deadGenerationExchangeName,
    'fanout',
    { durable: false },
  );

  const { queue: deadLetterQueue } = await c.assertQueue(
    '',
    { exclusive: true, durable: false, deadLetterExchange },
  );
  channel.consume(deadLetterQueue, (m) => onDeadGeneration(c, m));

  await c.bindQueue(deadLetterQueue, deadLetterExchange, '');

  // Ensure generation queue exists with correct dead letter exchange
  await c.assertQueue(
    generationQueueName,
    { durable: false, deadLetterExchange },
  );

  logger.debug('Generation queue created');
}

// eslint-disable-next-line import/prefer-default-export
export async function queueGeneration(params: Omit<GenerationQueueDataType, 'id' | 'createdAt'>) {
  const createdAt = new Date();
  let data: GenerationQueueDataType;
  try {
    if (!channel) {
      throw new Error('Channel not initialized');
    }

    data = {
      ...params,
      id: randomUUID(),
      createdAt,
    };

    const buf = Buffer.from(JSON.stringify(data));
    channel.sendToQueue(generationQueueName, buf);
    logger.debug({
      msg: 'Report queued for generation',
      size: buf.byteLength,
      sizeUnit: 'B',
    });
  } catch (err) {
    logger.error({
      msg: 'Failed to queue report',
      err,
    });

    return null;
  }

  try {
    const event: GenerationType = {
      id: data.id,
      taskId: data.task.id,
      status: 'PENDING',
      start: data.period.start,
      end: data.period.end,
      targets: data.targets,
      origin: data.origin,
      writeActivity: !!data.writeActivity,
      progress: null,
      took: null,
      reportId: '',
      createdAt,
      updatedAt: new Date(),
      startedAt: null,
    };

    const buf = Buffer.from(JSON.stringify(event));
    channel.publish('ezreeport.report:event', '', buf);
  } catch (err) {
    logger.warn({ msg: 'Failed to send event', err });
  }

  return data;
}
