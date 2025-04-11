import type { GenerationQueueDataType } from '@ezreeport/models/queues';
import type { GenerationType } from '@ezreeport/models/generations';

import { publishJSONToExchange, sendJSONToQueue } from '@ezreeport/rabbitmq';
import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

const generationQueueName = 'ezreeport.report:queues';
const generationEventExchangeName = 'ezreeport.report:event';

const logger = appLogger.child({ scope: 'queues', queue: generationQueueName });

let channel: rabbitmq.Channel | undefined;

export function initGenerationQueue(c: rabbitmq.Channel) {
  // queueGeneration will be called while begin unaware of
  // rabbitmq connection, so we need to store the channel
  // here
  channel = c;
}

type CustomGenerationQueueDataType = Omit<GenerationQueueDataType, 'createdAt'> & {
  createdAt?: Date;
};

export async function queueGeneration(data: CustomGenerationQueueDataType) {
  const createdAt = data.createdAt ?? new Date();

  try {
    if (!channel) {
      throw new Error('Channel not initialized');
    }

    const { size } = sendJSONToQueue<GenerationQueueDataType>(channel, generationQueueName, {
      ...data,
      createdAt,
    });
    logger.debug({
      queue: generationQueueName,
      msg: 'Report queued for generation',
      size,
      sizeUnit: 'B',
    });
  } catch (err) {
    logger.error({
      queue: generationQueueName,
      msg: 'Failed to queue report',
      err,
    });

    throw err;
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
}
