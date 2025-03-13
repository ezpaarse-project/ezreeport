import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import { getReportEventExchange } from './report/event';
import { getReportGenerationQueue } from './report/generation';
import { getReportSendExchange } from './report/send';

const logger = appLogger.child({ scope: 'queues' });

export default async function initQueues(connection: rabbitmq.ChannelModel) {
  const start = process.uptime();

  const channel = await connection.createChannel();
  await channel.prefetch(1);
  logger.debug({
    msg: 'Channel created',
    prefetch: 1,
  });

  // Create report send exchange
  await getReportSendExchange(channel);
  // Create report event exchange
  await getReportEventExchange(channel);
  // Create report generation queue
  await getReportGenerationQueue(channel);

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
