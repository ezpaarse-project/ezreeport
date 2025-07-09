import { Generation, GenerationType } from '@ezreeport/models/generations';
import { parseJSONMessage } from '@ezreeport/rabbitmq';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';
import { getWSNamespace, type Namespace } from '~/lib/sockets';

import { getTask } from '~/models/tasks';

const eventExchangeName = 'ezreeport.report:event';

const logger = appLogger.child({ scope: 'queues', exchange: eventExchangeName });

async function sendWSEvents(io: Namespace, data: GenerationType) {
  const event = 'generation:updated';

  let namespace;
  try {
    const task = await getTask(data.taskId);
    if (!task) {
      throw new Error(`Task ${data.taskId} not found`);
    }
    namespace = task.namespaceId;
  } catch (err) {
    logger.warn({ msg: "Couldn't send WS event to namespace", err });
    return;
  }

  io.to(namespace).emit(event, data);
}

async function onMessage(msg: rabbitmq.ConsumeMessage | null) {
  if (!msg) {
    return;
  }

  // Parse message
  const { data, raw, parseError } = parseJSONMessage(msg, Generation);
  if (!data) {
    logger.error({
      msg: 'Invalid data',
      data: process.env.NODE_ENV === 'production' ? undefined : raw,
      err: parseError,
    });
    return;
  }

  // try to fix issue where task is completed but not marked as such
  if (data.progress === 100 && data.status === 'PROCESSING') {
    data.status = 'SUCCESS';
  }

  const promises: Promise<unknown>[] = [];

  const io = getWSNamespace('generations');
  if (io) {
    promises.push(
      sendWSEvents(io, data),
    );
  }

  // Resolve all promises in parallel
  await Promise.allSettled(promises);
}

export async function initReportEventExchange(channel: rabbitmq.Channel) {
  const { exchange: eventExchange } = await channel.assertExchange(eventExchangeName, 'fanout', { durable: false });

  // Create queue to bind
  const { queue } = await channel.assertQueue('', { exclusive: true, durable: false });
  channel.bindQueue(queue, eventExchange, '');

  // Consume event exchange
  channel.consume(queue, (m) => onMessage(m), { noAck: true });

  logger.debug({
    msg: 'Event exchange created',
    exchange: eventExchange,
    queue,
  });
}
