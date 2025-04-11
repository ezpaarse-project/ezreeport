import { Generation, GenerationType } from '@ezreeport/models/generations';
import { parseJSONMessage } from '@ezreeport/rabbitmq';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import { upsertGeneration } from '~/models/generations';
import { createActivity } from '~/models/task-activity';
import { editTaskAfterGeneration } from '~/models/tasks';

const eventExchangeName = 'ezreeport.report:event';

const logger = appLogger.child({ scope: 'queues', exchange: eventExchangeName });

const generationFinished = (data: GenerationType) => data.status === 'SUCCESS' || data.status === 'ERROR';

async function updateGeneration(data: GenerationType) {
  try {
    await upsertGeneration(data.id, data);
  } catch (err) {
    const severity = generationFinished(data) ? 'error' : 'warn';
    logger[severity]({
      msg: "Couldn't update generation",
      id: data.id,
      err,
    });
  }
}

async function updateTaskAfterGeneration(data: GenerationType) {
  try {
    await createActivity({
      taskId: data.taskId,
      type: data.status === 'SUCCESS' ? 'generation:success' : 'generation:error',
      message: data.status === 'SUCCESS' ? `Rapport généré par ${data.origin}` : `Rapport non généré par ${data.origin} suite à une erreur.`,
      data: {
        period: { start: data.start, end: data.end },
        targets: data.targets,
      },
    });
  } catch (err) {
    logger.error({
      msg: "Couldn't update activity",
      id: data.id,
      taskId: data.taskId,
      err,
    });
  }

  // Update task
  try {
    await editTaskAfterGeneration(
      data.taskId,
      data.createdAt,
      data.status !== 'ERROR',
    );
  } catch (err) {
    logger.error({
      msg: "Couldn't update task",
      id: data.id,
      taskId: data.taskId,
      err,
    });
  }
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

  promises.push(
    updateGeneration(data),
  );

  if (data.writeActivity && generationFinished(data)) {
    promises.push(
      updateTaskAfterGeneration(data),
    );
  }

  // Resolve all promises in parallel
  await Promise.allSettled(promises);
}

// eslint-disable-next-line import/prefer-default-export
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
