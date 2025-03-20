import { randomUUID } from 'node:crypto';

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

// eslint-disable-next-line import/prefer-default-export
export async function queueGeneration(params: Omit<GenerationQueueDataType, 'id'>) {
  let data: GenerationQueueDataType;
  try {
    if (!channel) {
      throw new Error('Channel not initialized');
    }

    data = {
      ...params,
      id: randomUUID(),
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
      reportId: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const buf = Buffer.from(JSON.stringify(event));
    channel.publish('ezreeport.report:event', '', buf);
  } catch (err) {
    logger.warn({ msg: 'Failed to send event', err });
  }

  return data;
}
