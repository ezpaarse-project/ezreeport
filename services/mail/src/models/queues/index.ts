import { appLogger } from '~/lib/logger';
import rabbitmq, { getConnection } from '~/lib/rabbitmq';

import { isReportData, MailQueueData, MailQueueDataType } from '~common/types/queues';

import sendError from '~/models/mail/error';
import sendFailedReport from '~/models/mail/report/failed';
import sendSuccessReport from '~/models/mail/report/success';

const logger = appLogger.child({ scope: 'queues' });

const sendExchangeName = 'ezreeport.report:send';
const mailQueueName = 'ezreeport.report:send:mail';

let channel: rabbitmq.Channel | undefined;
let sendExchange: rabbitmq.Replies.AssertExchange | undefined;

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
    }

    await sendSuccessReport(data, logger);
  } catch (err) {
    logger.error({
      err,
      msg: 'Error when sending report',
    });
  }
}

export default async function initQueue() {
  const start = process.uptime();

  const connection = await getConnection();

  channel = await connection.createChannel();
  await channel.prefetch(1);
  logger.debug('Channel created');

  // Create send exchange
  sendExchange = await channel.assertExchange(sendExchangeName, 'direct', { durable: false });
  logger.debug({
    msg: 'Exchange created',
    ...sendExchange,
  });

  // Create mail queue
  const queue = await channel.assertQueue(mailQueueName, { durable: false });
  channel.bindQueue(queue.queue, sendExchange.exchange, 'mail');
  logger.debug({
    msg: 'Queue created',
    ...queue,
  });

  // Consume mail queue
  channel.consume(
    queue.queue,
    (m) => onMessage(m).then(() => m && channel!.ack(m)),
    { noAck: false },
  );

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
