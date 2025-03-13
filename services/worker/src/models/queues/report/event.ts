import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import type { GenerationType } from '~common/types/generations';
import getChannel from '../channel';

const eventExchangeName = 'ezreeport.report:event';

const logger = appLogger.child({ scope: 'queues', exchange: eventExchangeName });

let eventExchange: rabbitmq.Replies.AssertExchange | undefined;

export async function getReportEventExchange(channel: rabbitmq.Channel) {
  if (!eventExchange) {
    eventExchange = await channel.assertExchange(eventExchangeName, 'fanout', { durable: false });
    logger.debug('Event exchange created');
  }
  return eventExchange;
}

export async function sendEvent(data: GenerationType) {
  const channel = await getChannel();
  const { exchange } = await getReportEventExchange(channel);

  const buf = Buffer.from(JSON.stringify(data));
  channel.publish(exchange, '', buf);
  logger.trace({
    jobId: data.id,
    msg: 'Event sent',
    size: buf.byteLength,
    sizeUnit: 'B',
  });
}
