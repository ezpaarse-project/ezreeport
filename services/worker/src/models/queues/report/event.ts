import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import type { GenerationType } from '~common/types/generations';

const eventExchangeName = 'ezreeport.report:event';

const logger = appLogger.child({ scope: 'queues', exchange: eventExchangeName });

export async function getReportEventExchange(channel: rabbitmq.Channel) {
  await channel.assertExchange(eventExchangeName, 'fanout', { durable: false });

  logger.debug('Event exchange created');
}

export async function sendEvent(channel: rabbitmq.Channel, data: GenerationType) {
  try {
    const buf = Buffer.from(JSON.stringify(data));
    channel.publish(eventExchangeName, '', buf);
    logger.trace({
      jobId: data.id,
      msg: 'Event sent',
      size: buf.byteLength,
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
