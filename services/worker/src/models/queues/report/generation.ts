import EventEmitter from 'node:events';

import type { GenerationStatusType } from '@ezreeport/models/generations';
import type { ReportResultType } from '@ezreeport/models/reports';
import type { TemplateBodyType } from '@ezreeport/models/templates';
import { GenerationQueueData } from '@ezreeport/models/queues';
import { parseJSONMessage } from '@ezreeport/rabbitmq';

import type rabbitmq from '~/lib/rabbitmq';
import config from '~/lib/config';
import { appLogger } from '~/lib/logger';

import { type GenerationEventMap, generateReport } from '~/models/generation';

import { sendEvent } from './event';
import { sendReport } from './send';

const generationQueueName = 'ezreeport.report:queues';
const deadGenerationExchangeName = 'ezreeport.report:queues:dead';

const { team } = config.report;
const logger = appLogger.child({ queue: generationQueueName, scope: 'queues' });

async function onMessage(
  channel: rabbitmq.Channel,
  msg: rabbitmq.ConsumeMessage | null
): Promise<void> {
  if (!msg) {
    return;
  }

  // Parse message
  const { data, raw, parseError } = parseJSONMessage(msg, GenerationQueueData);
  if (!data) {
    logger.error({
      data: process.env.NODE_ENV === 'production' ? undefined : raw,
      err: parseError,
      msg: 'Invalid data',
    });
    channel.nack(msg, undefined, false);
    return;
  }

  // Setup events
  const events = new EventEmitter<GenerationEventMap>();
  let reportId = '';
  let startedAt: Date | null = null;
  let pageTotal = 0;
  let pageRendered = 0;
  const updateProgress = (status: GenerationStatusType) =>
    sendEvent(channel, {
      createdAt: data.createdAt,
      end: data.period.end,
      id: data.id,
      origin: data.origin,
      progress: pageTotal ? Math.round((pageRendered / pageTotal) * 100) : null,
      reportId,
      start: data.period.start,
      startedAt,
      status,
      targets: data.targets,
      taskId: data.task.id,
      took: startedAt ? Date.now() - startedAt.getTime() : null,
      updatedAt: new Date(),
      writeActivity: !!data.writeActivity,
    });
  events.on('start', (event) => {
    ({ reportId } = event as { reportId: string });
    startedAt = new Date();
    updateProgress('PROCESSING');
  });
  events.on('resolve:template', (event) => {
    const { layouts } = event as TemplateBodyType;
    pageTotal = layouts.length;
  });
  events.on('render:layout', () => {
    pageRendered += 1;
    updateProgress('PROCESSING');
  });
  events.on('render:template', () => {
    pageRendered = pageTotal;
    updateProgress('PROCESSING');
  });
  events.on('end', (event) => {
    const { success } = event as ReportResultType;
    updateProgress(success ? 'SUCCESS' : 'ERROR');
  });

  // Generate report
  let result;
  try {
    result = await generateReport(data, events);
  } catch (error) {
    updateProgress('ERROR');
    logger.error({
      jobId: data.id,
      msg: 'Error while generating report',
      error,
    });
    channel.ack(msg);
    return;
  }

  // Send result
  const targets = result.detail.sendingTo || [team];
  if (targets.length > 0) {
    sendReport(channel, 'mail', {
      date: result.detail.createdAt,
      filename:
        result.success && result.detail.files.report
          ? result.detail.files.report
          : result.detail.files.detail,
      generationId: data.id,
      locale: result.detail.locale,
      namespace: data.namespace,
      period: result.detail.period,
      success: result.success,
      targets,
      task: data.task,
    });
  }

  channel.ack(msg);
}

export async function getReportGenerationQueue(
  channel: rabbitmq.Channel
): Promise<void> {
  const { exchange: deadLetterExchange } = await channel.assertExchange(
    deadGenerationExchangeName,
    'fanout',
    { durable: true }
  );

  const { queue } = await channel.assertQueue(generationQueueName, {
    deadLetterExchange,
    durable: true,
  });

  // Consume generation queue
  channel.consume(queue, (msg) => onMessage(channel, msg));

  logger.debug('Generation queue created');
}
