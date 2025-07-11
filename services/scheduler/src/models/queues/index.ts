import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import { initReportEventExchange } from './report/event';
import { initGenerationQueue } from './report/generation';

const logger = appLogger.child({ scope: 'queues' });

export default async function initQueues(
  connection: rabbitmq.ChannelModel
): Promise<void> {
  const start = process.uptime();

  const channel = await connection.createChannel();
  logger.debug('Channel created');

  // Create generation queue
  initGenerationQueue(channel);

  // Create report event exchange
  await initReportEventExchange(channel);

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
