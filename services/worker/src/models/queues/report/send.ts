import type { MailQueueDataType } from '@ezreeport/models/queues';
import { sendJSONMessage } from '@ezreeport/rabbitmq';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

const sendExchangeName = 'ezreeport.report:send';

const logger = appLogger.child({ scope: 'queues', exchange: sendExchangeName });

export async function getReportSendExchange(
  channel: rabbitmq.Channel
): Promise<void> {
  await channel.assertExchange(sendExchangeName, 'direct', { durable: false });

  logger.debug('Send exchange created');
}

export function sendReport(
  channel: rabbitmq.Channel,
  type: 'mail',
  data: MailQueueDataType
): void {
  try {
    const { size } = sendJSONMessage(
      { channel, exchange: { name: sendExchangeName, routingKey: type } },
      data
    );
    logger.debug({
      msg: 'Report queued',
      type,
      size,
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
