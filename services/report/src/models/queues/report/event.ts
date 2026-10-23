import type { GenerationType } from '@ezreeport/models/generations';
import { Generation } from '@ezreeport/models/generations';
import { parseJSONMessage } from '@ezreeport/rabbitmq';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';
import { type Namespace, getWSNamespace } from '~/lib/sockets';

import { getTask } from '~/models/tasks';

const eventExchangeName = 'ezreeport.report:event';

const logger = appLogger.child({
  exchange: eventExchangeName,
  scope: 'queues',
});

async function sendWSEvents(
  io: Namespace,
  data: GenerationType
): Promise<void> {
  const event = 'generation:updated';

  let namespace;
  try {
    const task = await getTask(data.taskId);
    if (!task) {
      throw new Error(`Task ${data.taskId} not found`);
    }
    namespace = task.namespaceId;
  } catch (error) {
    logger.warn({ error, msg: "Couldn't send WS event to namespace" });
    return;
  }

  io.to(namespace).emit(event, data);
}

async function onMessage(msg: rabbitmq.ConsumeMessage | null): Promise<void> {
  if (!msg) {
    return;
  }

  // Parse message
  const { data, raw, parseError } = parseJSONMessage(msg, Generation);
  if (!data) {
    logger.error({
      data: process.env.NODE_ENV === 'production' ? undefined : raw,
      err: parseError,
      msg: 'Invalid data',
    });
    return;
  }

  // Try to fix issue where task is completed but not marked as such
  if (data.progress === 100 && data.status === 'PROCESSING') {
    data.status = 'SUCCESS';
  }

  const promises: Promise<unknown>[] = [];

  const io = getWSNamespace('generations');
  if (io) {
    promises.push(sendWSEvents(io, data));
  }

  // Resolve all promises in parallel
  await Promise.allSettled(promises);
}

export async function initReportEventExchange(
  channel: rabbitmq.Channel
): Promise<void> {
  const { exchange: eventExchange } = await channel.assertExchange(
    eventExchangeName,
    'fanout',
    { durable: false }
  );

  // Create queue to bind
  const { queue } = await channel.assertQueue('', {
    durable: false,
    exclusive: true,
  });
  channel.bindQueue(queue, eventExchange, '');

  // Consume event exchange
  channel.consume(queue, (msg) => onMessage(msg), { noAck: true });

  logger.debug({
    exchange: eventExchange,
    msg: 'Event exchange created',
    queue,
  });
}
