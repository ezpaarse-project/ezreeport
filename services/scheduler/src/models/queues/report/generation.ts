import { randomUUID } from 'node:crypto';

import { GenerationQueueData, type GenerationQueueDataType } from '@ezreeport/models/queues';
import type { GenerationType } from '@ezreeport/models/generations';
import { parseJSONMessage, publishJSONToExchange, sendJSONToQueue } from '@ezreeport/rabbitmq';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

const generationQueueName = 'ezreeport.report:queues';
const deadGenerationExchangeName = 'ezreeport.report:queues:dead';
const generationEventExchangeName = 'ezreeport.report:event';

const logger = appLogger.child({ scope: 'queues', queue: generationQueueName });

let channel: rabbitmq.Channel | undefined;

async function onDeadGeneration(c: rabbitmq.Channel, msg: rabbitmq.ConsumeMessage | null) {
  if (!msg) {
    return;
  }

  // Parse message
  const { data, raw, parseError } = parseJSONMessage(msg, GenerationQueueData);
  if (!data) {
    logger.error({
      msg: 'Invalid data',
      data: process.env.NODE_ENV === 'production' ? undefined : raw,
      err: parseError,
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

    publishJSONToExchange<GenerationType>(c, generationEventExchangeName, '', event);

    logger.warn({
      msg: 'Generation aborted',
      taskId: data.task.id,
      task: data.task.name,
      generationId: data.id,
      generation: event,
    });
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

    const { size } = sendJSONToQueue<GenerationQueueDataType>(channel, generationQueueName, data);
    logger.debug({
      msg: 'Report queued for generation',
      size,
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
    publishJSONToExchange<GenerationType>(channel, generationEventExchangeName, '', {
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
    });
  } catch (err) {
    logger.warn({ msg: 'Failed to send event', err });
  }

  return data;
}
