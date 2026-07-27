import type { GenerationType } from '@ezreeport/models/generations';
import type { GenerationQueueDataType } from '@ezreeport/models/queues';
import { sendJSONMessage } from '@ezreeport/rabbitmq';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

const generationQueueName = 'ezreeport.report:queues';
const generationEventExchangeName = 'ezreeport.report:event';

const logger = appLogger.child({ queue: generationQueueName, scope: 'queues' });

let channel: rabbitmq.Channel | undefined;

export function initGenerationQueue(chan: rabbitmq.Channel): void {
  // QueueGeneration will be called while begin unaware of
  // Rabbitmq connection, so we need to store the channel
  // Here
  channel = chan;
}

type CustomGenerationQueueDataType = Omit<
  GenerationQueueDataType,
  'createdAt'
> & {
  createdAt?: Date;
};

export function queueGeneration(
  data: CustomGenerationQueueDataType,
  ttl?: number
): void {
  const createdAt = data.createdAt ?? new Date();

  try {
    if (!channel) {
      throw new Error('Channel not initialized');
    }

    const { size } = sendJSONMessage<GenerationQueueDataType>(
      { channel, queue: { name: generationQueueName } },
      { ...data, createdAt }
    );
    logger.debug({
      msg: 'Report queued for generation',
      queue: generationQueueName,
      size,
      sizeUnit: 'B',
    });
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Failed to queue report',
      queue: generationQueueName,
    });

    throw error;
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
      },
      { expiration: ttl }
    );
  } catch (error) {
    logger.warn({ error, msg: 'Failed to send event' });
  }
}
