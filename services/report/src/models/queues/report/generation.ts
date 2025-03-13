import { appLogger } from '~/lib/logger';

import type { GenerationQueueDataType } from '~common/types/queues';

import getChannel from '../channel';

const generationQueueName = 'ezreeport.report:queues';

const logger = appLogger.child({ scope: 'queues', queue: generationQueueName });

// eslint-disable-next-line import/prefer-default-export
export async function queueGeneration(params: GenerationQueueDataType) {
  const channel = await getChannel();

  const data: GenerationQueueDataType = {
    ...params,
  };

  const buf = Buffer.from(JSON.stringify(data));
  channel.sendToQueue(generationQueueName, buf);
  logger.debug({
    queue: generationQueueName,
    msg: 'Report queued for generation',
    size: buf.byteLength,
    sizeUnit: 'B',
  });

  return data;
}
