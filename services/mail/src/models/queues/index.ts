import { appLogger } from '~/lib/logger';

import getChannel from './channel';
import { getReportSendExchange } from './report/send';

const logger = appLogger.child({ scope: 'queues' });

export default async function initQueues() {
  const start = process.uptime();

  const channel = await getChannel();

  // Create send exchange
  await getReportSendExchange(channel);

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
