import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import { isReportData, MailQueueData, MailQueueDataType } from '~common/types/queues';

import sendError from '~/models/mail/error';
import sendFailedReport from '~/models/mail/report/failed';
import sendSuccessReport from '~/models/mail/report/success';

const sendExchangeName = 'ezreeport.report:send';
const mailQueueName = 'ezreeport.report:send:mail';

const logger = appLogger.child({ scope: 'queues', exchange: sendExchangeName });

async function onMessage(msg: rabbitmq.ConsumeMessage | null) {
  if (!msg) {
    return;
  }

  // Parse message
  const raw = JSON.parse(msg.content.toString());
  let data: MailQueueDataType;
  try {
    data = await MailQueueData.parseAsync(raw);
  } catch (err) {
    logger.error({
      msg: 'Invalid data',
      data: process.env.NODE_ENV === 'production' ? undefined : raw,
      err,
    });
    return;
  }

  // Send mail
  try {
    if (!isReportData(data)) {
      await sendError(data, logger);
      return;
    }

    if (!data.success) {
      await sendFailedReport(data, logger);
      return;
    }

    await sendSuccessReport(data, logger);
  } catch (err) {
    logger.error({
      err,
      msg: 'Error when sending report',
    });
  }
}

// eslint-disable-next-line import/prefer-default-export
export async function initReportSendExchange(channel: rabbitmq.Channel) {
  const { exchange: sendExchange } = await channel.assertExchange(sendExchangeName, 'direct', { durable: false });

  // Create queue to bind
  const { queue } = await channel.assertQueue(mailQueueName, { durable: false });
  channel.bindQueue(queue, sendExchange, 'mail');

  // Consume mail queue
  channel.consume(
    queue,
    (m) => onMessage(m).then(() => m && channel!.ack(m)),
    { noAck: false },
  );

  logger.debug({
    msg: 'Send exchange created',
    exchange: sendExchange,
    queue,
  });
}
