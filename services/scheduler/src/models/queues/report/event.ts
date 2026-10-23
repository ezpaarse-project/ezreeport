import { Generation, type GenerationType } from '@ezreeport/models/generations';
import { parseJSONMessage } from '@ezreeport/rabbitmq';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import { upsertGeneration } from '~/models/generations';
import { createActivity } from '~/models/task-activity';
import { editTaskAfterGeneration } from '~/models/tasks';

const eventExchangeName = 'ezreeport.report:event';

const logger = appLogger.child({
  exchange: eventExchangeName,
  scope: 'queues',
});

const generationEndedCache = new Map<string, NodeJS.Timeout>();

/**
 * Check if generation is finished
 *
 * @param data The generation
 *
 * @returns Is the generation finished
 */
const generationFinished = (data: GenerationType): boolean =>
  data.status === 'SUCCESS' || data.status === 'ERROR';

/**
 * Check if generation is finished, debounce using locks
 *
 * @param data The generation
 *
 * @returns Is the generation finished and if lock is free
 */
function debouncedGenerationFinished(data: GenerationType): boolean {
  const hasGenerationFinished = generationFinished(data);
  const timeoutId = generationEndedCache.get(data.id);

  if (!timeoutId && hasGenerationFinished) {
    // Generation has ended and is not yet in cache, so we set the lock for 1 min
    generationEndedCache.set(
      data.id,
      setTimeout(() => generationEndedCache.delete(data.id), 1 * 60 * 1000)
    );

    return true;
  }

  if (timeoutId && !hasGenerationFinished) {
    // Generation was restarted, so we remove the timeout and the cache entry
    clearTimeout(timeoutId);
    generationEndedCache.delete(data.id);
  }

  return false;
}

async function updateGeneration(data: GenerationType): Promise<void> {
  try {
    await upsertGeneration(data.id, data);
  } catch (error) {
    const severity = generationFinished(data) ? 'error' : 'warn';
    logger[severity]({
      err: error,
      id: data.id,
      msg: "Couldn't update generation",
    });
  }
}

async function updateTaskAfterGeneration(data: GenerationType): Promise<void> {
  try {
    await createActivity({
      data: {
        generationId: data.id,
        period: { end: data.end, start: data.start },
        targets: data.targets,
      },
      message:
        data.status === 'SUCCESS'
          ? `Rapport généré par ${data.origin}`
          : `Rapport non généré par ${data.origin} suite à une erreur.`,
      taskId: data.taskId,
      type:
        data.status === 'SUCCESS' ? 'generation:success' : 'generation:error',
    });
  } catch (error) {
    logger.error({
      err: error,
      id: data.id,
      msg: "Couldn't update activity",
      taskId: data.taskId,
    });
  }

  // Update task
  try {
    await editTaskAfterGeneration(
      data.taskId,
      data.createdAt,
      data.status !== 'ERROR'
    );
  } catch (error) {
    logger.error({
      err: error,
      id: data.id,
      msg: "Couldn't update task",
      taskId: data.taskId,
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

  const promises: Promise<unknown>[] = [updateGeneration(data)];

  if (data.writeActivity && debouncedGenerationFinished(data)) {
    promises.push(updateTaskAfterGeneration(data));
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
