import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import type { GenerationQueueDataType } from '~common/types/queues';
import type { GenerationType } from '~common/types/generations';

const generationQueueName = 'ezreeport.report:queues';

const logger = appLogger.child({ scope: 'queues', queue: generationQueueName });

let channel: rabbitmq.Channel | undefined;

export function initGenerationQueue(c: rabbitmq.Channel) {
  // queueGeneration will be called while begin unaware of
  // rabbitmq connection, so we need to store the channel
  // here
  channel = c;
}

export async function queueGeneration(data: GenerationQueueDataType) {
  try {
    if (!channel) {
      throw new Error('Channel not initialized');
    }

    const buf = Buffer.from(JSON.stringify(data));
    channel.sendToQueue(generationQueueName, buf);
    logger.debug({
      queue: generationQueueName,
      msg: 'Report queued for generation',
      size: buf.byteLength,
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
    const event: GenerationType = {
      id: data.id,
      taskId: data.task.id,
      status: 'PENDING',
      start: data.period.start,
      end: data.period.end,
      targets: data.targets,
      origin: data.origin,
      reportId: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const buf = Buffer.from(JSON.stringify(event));
    channel.publish('ezreeport.report:event', '', buf);
  } catch (err) {
    logger.warn({ msg: 'Failed to send event', err });
  }
}
