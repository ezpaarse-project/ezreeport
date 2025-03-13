import { appLogger } from '~/lib/logger';

import getChannel from './channel';
import { getReportEventExchange } from './report/event';
import { getReportGenerationQueue } from './report/generation';
import { getReportSendExchange } from './report/send';

const logger = appLogger.child({ scope: 'queues' });

export default async function initQueues() {
  const start = process.uptime();

  const channel = await getChannel();

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
