import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import type { MailQueueDataType } from '~common/types/queues';

import getChannel from '../channel';

const sendExchangeName = 'ezreeport.report:send';

const logger = appLogger.child({ scope: 'queues', exchange: sendExchangeName });

let sendExchange: rabbitmq.Replies.AssertExchange | undefined;

export async function getReportSendExchange(channel: rabbitmq.Channel) {
  if (!sendExchange) {
    sendExchange = await channel.assertExchange(sendExchangeName, 'direct', { durable: false });
    logger.debug('Send exchange created');
  }
  return sendExchange;
}

export async function sendReport(type: 'mail', data: MailQueueDataType) {
  const channel = await getChannel();
  const { exchange } = await getReportSendExchange(channel);

  const buf = Buffer.from(JSON.stringify(data));
  channel.publish(exchange, type, buf);
  logger.debug({
    msg: 'Mail queued',
    size: buf.byteLength,
    sizeUnit: 'B',
  });
}
