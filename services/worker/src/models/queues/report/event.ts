import type { GenerationType } from '@ezreeport/models/generations';
import { sendJSONMessage } from '@ezreeport/rabbitmq';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

const eventExchangeName = 'ezreeport.report:event';

const logger = appLogger.child({
  scope: 'queues',
  exchange: eventExchangeName,
});

export async function getReportEventExchange(
  channel: rabbitmq.Channel
): Promise<void> {
  await channel.assertExchange(eventExchangeName, 'fanout', { durable: false });

  logger.debug('Event exchange created');
}

export function sendEvent(
  channel: rabbitmq.Channel,
  data: GenerationType
): void {
  try {
    const { size } = sendJSONMessage(
      { channel, exchange: { name: eventExchangeName, routingKey: '' } },
      data
    );
    logger.trace({
      jobId: data.id,
      msg: 'Event sent',
      size,
      sizeUnit: 'B',
    });
  } catch (err) {
    logger.error({
      jobId: data.id,
      msg: 'Failed to send event sent',
      err,
    });
  }
}
