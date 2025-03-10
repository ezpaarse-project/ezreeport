import { appLogger } from '~/lib/logger';
import rabbitmq, { getConnection } from '~/lib/rabbitmq';

import type { GenerationQueueDataType } from '~common/types/queues';

const logger = appLogger.child({ scope: 'queues' });

const generationQueue = 'ezreeport.report:generation';

let channel: rabbitmq.Channel | undefined;

export function queueGeneration(data: GenerationQueueDataType) {
  if (!channel) {
    throw new Error('queues are not initialized');
  }

  channel.sendToQueue(generationQueue, Buffer.from(JSON.stringify(data)));
  logger.debug({
    queue: generationQueue,
    msg: 'Report queued for generation',
  });
}

export async function initQueue() {
  const start = process.uptime();

  const connection = await getConnection();

  channel = await connection.createChannel();
  logger.debug('Channel created');

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
