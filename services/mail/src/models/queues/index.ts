import rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import { initReportSendExchange } from './report/send';

const logger = appLogger.child({ scope: 'queues' });

export default async function initQueues(connection: rabbitmq.ChannelModel) {
  const start = process.uptime();

  const channel = await connection.createChannel();
  logger.debug('Channel created');

  // Create send exchange
  await initReportSendExchange(channel);

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
