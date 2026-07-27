import { MailQueueData, isReportData } from '@ezreeport/models/queues';
import { parseJSONMessage } from '@ezreeport/rabbitmq';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import { sendError } from '~/models/mail/error';
import { sendFailedReport } from '~/models/mail/report/failed';
import { sendSuccessReport } from '~/models/mail/report/success';

const sendExchangeName = 'ezreeport.report:send';
const mailQueueName = 'ezreeport.report:send:mail';

const logger = appLogger.child({ exchange: sendExchangeName, scope: 'queues' });

async function onMessage(
  channel: rabbitmq.Channel,
  msg: rabbitmq.ConsumeMessage | null
): Promise<void> {
  if (!msg) {
    return;
  }

  // Parse message
  const { data, raw, parseError } = parseJSONMessage(msg, MailQueueData);
  if (!data) {
    logger.error({
      data: process.env.NODE_ENV === 'production' ? undefined : raw,
      err: parseError,
      msg: 'Invalid data',
    });
    channel.nack(msg, undefined, false);
    return;
  }

  // Send mail
  try {
    if (!isReportData(data)) {
      await sendError(data, logger);
      channel.ack(msg);
      return;
    }

    if (!data.success) {
      await sendFailedReport(data, logger);
      channel.ack(msg);
      return;
    }

    await sendSuccessReport(data, logger);
    channel.ack(msg);
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Error when sending report',
    });
    channel.nack(msg);
  }
}

export async function initReportSendExchange(
  channel: rabbitmq.Channel
): Promise<void> {
  const { exchange: sendExchange } = await channel.assertExchange(
    sendExchangeName,
    'direct',
    { durable: false }
  );

  // Create queue to bind
  const { queue } = await channel.assertQueue(mailQueueName, {
    durable: true,
  });
  channel.bindQueue(queue, sendExchange, 'mail');

  // Consume mail queue
  channel.consume(queue, (msg) => onMessage(channel, msg));

  logger.debug({
    exchange: sendExchange,
    msg: 'Send exchange created',
    queue,
  });
}
