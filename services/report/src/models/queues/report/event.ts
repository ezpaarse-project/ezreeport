import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import { Generation, GenerationType } from '~common/types/generations';
import { upsertGeneration } from '~/models/generations';
import { createActivity } from '~/models/task-activity';
import { editTaskAfterGeneration } from '~/models/tasks';

const eventExchangeName = 'ezreeport.report:event';

const logger = appLogger.child({ scope: 'queues', exchange: eventExchangeName });

const generationFinished = (data: GenerationType) => data.status === 'SUCCESS' || data.status === 'ERROR';

async function onMessage(msg: rabbitmq.ConsumeMessage | null) {
  if (!msg) {
    return;
  }

  // Parse message
  const raw = JSON.parse(msg.content.toString());
  let data;
  try {
    data = await Generation.parseAsync(raw);
  } catch (err) {
    logger.error({
      msg: 'Invalid data',
      data: process.env.NODE_ENV === 'production' ? undefined : raw,
      err,
    });
    return;
  }

  // Update generation in DB
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

  if (data.writeActivity && generationFinished(data)) {
    // Update activity if needed
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
        data.status === 'ERROR',
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

  // TODO: websockets
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
