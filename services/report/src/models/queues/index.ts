import { appLogger } from '~/lib/logger';

import getChannel from './channel';
import { getReportEventExchange } from './report/event';

const logger = appLogger.child({ scope: 'queues' });

export default async function initQueues() {
  const start = process.uptime();

  const channel = await getChannel();

  // Create report event exchange
  await getReportEventExchange(channel);

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
