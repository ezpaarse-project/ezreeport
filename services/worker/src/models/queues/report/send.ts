import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import type { MailQueueDataType } from '~common/types/queues';

const sendExchangeName = 'ezreeport.report:send';

const logger = appLogger.child({ scope: 'queues', exchange: sendExchangeName });

export async function getReportSendExchange(channel: rabbitmq.Channel) {
  await channel.assertExchange(sendExchangeName, 'direct', { durable: false });

  logger.debug('Send exchange created');
}

export async function sendReport(channel: rabbitmq.Channel, type: 'mail', data: MailQueueDataType) {
  try {
    const buf = Buffer.from(JSON.stringify(data));
    channel.publish(sendExchangeName, type, buf);
    logger.debug({
      msg: 'Report queued',
      type,
      size: buf.byteLength,
      sizeUnit: 'B',
    });
  } catch (err) {
    logger.error({
      msg: 'Failed to send report',
      type,
      err,
    });
  }
}
