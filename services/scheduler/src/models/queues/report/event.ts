import { Generation, type GenerationType } from '@ezreeport/models/generations';
import { parseJSONMessage } from '@ezreeport/rabbitmq';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import { upsertGeneration } from '~/models/generations';
import { createActivity } from '~/models/task-activity';
import { editTaskAfterGeneration } from '~/models/tasks';

const eventExchangeName = 'ezreeport.report:event';

const logger = appLogger.child({
  scope: 'queues',
  exchange: eventExchangeName,
});

const generationEndedCache = new Map<string, NodeJS.Timeout>();

const generationFinished = (data: GenerationType): boolean =>
  data.status === 'SUCCESS' || data.status === 'ERROR';

async function updateGeneration(data: GenerationType): Promise<void> {
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

async function updateTaskAfterGeneration(data: GenerationType): Promise<void> {
  try {
    await createActivity({
      taskId: data.taskId,
      type:
        data.status === 'SUCCESS' ? 'generation:success' : 'generation:error',
      message:
        data.status === 'SUCCESS'
          ? `Rapport généré par ${data.origin}`
          : `Rapport non généré par ${data.origin} suite à une erreur.`,
      data: {
        generationId: data.id,
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
      data.status !== 'ERROR'
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

async function onMessage(msg: rabbitmq.ConsumeMessage | null): Promise<void> {
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

  const promises: Promise<unknown>[] = [updateGeneration(data)];

  const hasGenerationFinished = generationFinished(data);
  const timeoutId = generationEndedCache.get(data.id);

  if (timeoutId && !hasGenerationFinished) {
    // Generation was restarted, so we remove the timeout and the cache entry
    clearTimeout(timeoutId);
    generationEndedCache.delete(data.id);
  }

  if (!timeoutId && hasGenerationFinished) {
    // Generation has ended and is not yet in cache, so we set the lock for 1 min
    generationEndedCache.set(
      data.id,
      setTimeout(() => generationEndedCache.delete(data.id), 1 * 60 * 1000)
    );

    // Write activity if asked
    if (data.writeActivity) {
      promises.push(updateTaskAfterGeneration(data));
    }
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
    exclusive: true,
    durable: false,
  });
  channel.bindQueue(queue, eventExchange, '');

  // Consume event exchange
  channel.consume(queue, (msg) => onMessage(msg), { noAck: true });

  logger.debug({
    msg: 'Event exchange created',
    exchange: eventExchange,
    queue,
  });
}
