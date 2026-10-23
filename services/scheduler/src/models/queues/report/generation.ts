import { randomUUID } from 'node:crypto';

import type { GenerationType } from '@ezreeport/models/generations';
import {
  GenerationQueueData,
  type GenerationQueueDataType,
} from '@ezreeport/models/queues';
import { parseJSONMessage, sendJSONMessage } from '@ezreeport/rabbitmq';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

const generationQueueName = 'ezreeport.report:queues';
const deadGenerationExchangeName = 'ezreeport.report:queues:dead';
const generationEventExchangeName = 'ezreeport.report:event';

const logger = appLogger.child({ queue: generationQueueName, scope: 'queues' });

let channel: rabbitmq.Channel | undefined;

function onDeadGeneration(
  chan: rabbitmq.Channel,
  msg: rabbitmq.ConsumeMessage | null
): void {
  if (!msg) {
    return;
  }

  // Parse message
  const { data, raw, parseError } = parseJSONMessage(msg, GenerationQueueData);
  if (!data) {
    logger.error({
      data: process.env.NODE_ENV === 'production' ? undefined : raw,
      err: parseError,
      msg: 'Invalid data',
    });
    chan.nack(msg, undefined, false);
    return;
  }

  try {
    const event: GenerationType = {
      createdAt: data.createdAt,
      end: data.period.end,
      id: data.id,
      origin: data.origin,
      progress: null,
      reportId: '',
      start: data.period.start,
      startedAt: null,
      status: 'ABORTED',
      targets: data.targets,
      taskId: data.task.id,
      took: null,
      updatedAt: new Date(),
      writeActivity: Boolean(data.writeActivity),
    };

    sendJSONMessage<GenerationType>(
      {
        channel: chan,
        exchange: { name: generationEventExchangeName, routingKey: '' },
      },
      event
    );

    logger.warn({
      generation: event,
      generationId: data.id,
      msg: 'Generation aborted',
      task: data.task.name,
      taskId: data.task.id,
    });
  } catch (error) {
    logger.error({ error, msg: 'Failed to send event' });
  }
  chan.ack(msg);
}

export async function initGenerationQueue(
  chan: rabbitmq.Channel
): Promise<void> {
  // QueueGeneration will be called while begin unaware of
  // Rabbitmq connection, so we need to store the channel
  // Here
  channel = chan;

  const { exchange: deadLetterExchange } = await chan.assertExchange(
    deadGenerationExchangeName,
    'fanout',
    { durable: true }
  );

  const { queue: deadLetterQueue } = await chan.assertQueue('', {
    deadLetterExchange,
    durable: false,
    exclusive: true,
  });
  channel.consume(deadLetterQueue, (msg) => onDeadGeneration(chan, msg));

  await chan.bindQueue(deadLetterQueue, deadLetterExchange, '');

  // Ensure generation queue exists with correct dead letter exchange
  await chan.assertQueue(generationQueueName, {
    deadLetterExchange,
    durable: true,
  });

  logger.debug('Generation queue created');
}

export function queueGeneration(
  params: Omit<GenerationQueueDataType, 'id' | 'createdAt'>
): GenerationQueueDataType | null {
  const createdAt = new Date();
  let data: GenerationQueueDataType;
  try {
    if (!channel) {
      throw new Error('Channel not initialized');
    }

    data = {
      ...params,
      createdAt,
      id: randomUUID(),
    };

    const { size } = sendJSONMessage<GenerationQueueDataType>(
      { channel, queue: { name: generationQueueName } },
      data
    );
    logger.debug({
      msg: 'Report queued for generation',
      size,
      sizeUnit: 'B',
    });
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Failed to queue report',
    });

    return null;
  }

  try {
    sendJSONMessage<GenerationType>(
      {
        channel,
        exchange: { name: generationEventExchangeName, routingKey: '' },
      },
      {
        createdAt,
        end: data.period.end,
        id: data.id,
        origin: data.origin,
        progress: null,
        reportId: '',
        start: data.period.start,
        startedAt: null,
        status: 'PENDING',
        targets: data.targets,
        taskId: data.task.id,
        took: null,
        updatedAt: new Date(),
        writeActivity: Boolean(data.writeActivity),
      }
    );
  } catch (error) {
    logger.warn({ error, msg: 'Failed to send event' });
  }

  return data;
}
