import EventEmitter from 'node:events';

import { GenerationQueueData } from '@ezreeport/models/queues';
import type { TemplateBodyType } from '@ezreeport/models/templates';
import type { GenerationStatusType } from '@ezreeport/models/generations';
import type { ReportResultType } from '@ezreeport/models/reports';
import { parseJSONMessage } from '@ezreeport/rabbitmq';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';
import config from '~/lib/config';

import { generateReport, type GenerationEventMap } from '~/models/generation';

import { sendEvent } from './event';
import { sendReport } from './send';

const { team } = config.report;

const generationQueueName = 'ezreeport.report:queues';
const deadGenerationExchangeName = 'ezreeport.report:queues:dead';

const logger = appLogger.child({ scope: 'queues', queue: generationQueueName });

async function onMessage(channel: rabbitmq.Channel, msg: rabbitmq.ConsumeMessage | null) {
  if (!msg) {
    return;
  }

  // Parse message
  const { data, raw, parseError } = parseJSONMessage(msg, GenerationQueueData);
  if (!data) {
    logger.error({
      msg: 'Invalid data',
      data: process.env.NODE_ENV === 'production' ? undefined : raw,
      err: parseError,
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
  const updateProgress = (status: GenerationStatusType) => sendEvent(channel, {
    id: data.id,
    taskId: data.task.id,
    start: data.period.start,
    end: data.period.end,
    origin: data.origin,
    targets: data.targets,
    writeActivity: !!data.writeActivity,
    status,
    progress: pageTotal ? Math.round((pageRendered / pageTotal) * 100) : null,
    took: startedAt ? Date.now() - startedAt.getTime() : null,
    reportId,
    createdAt: data.createdAt,
    updatedAt: new Date(),
    startedAt,
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
  } catch (err) {
    updateProgress('ERROR');
    logger.error({
      jobId: data.id,
      msg: 'Error while generating report',
      err,
    });
    channel.ack(msg);
    return;
  }

  // Send result
  sendReport(channel, 'mail', {
    generationId: data.id,
    task: data.task,
    namespace: data.namespace,

    success: result.success,
    date: result.detail.createdAt,
    period: result.detail.period,
    targets: result.detail.sendingTo || [team],

    filename: result.success && result.detail.files.report
      ? result.detail.files.report
      : result.detail.files.detail,
  });

  channel.ack(msg);
}

export async function getReportGenerationQueue(channel: rabbitmq.Channel) {
  const { exchange: deadLetterExchange } = await channel.assertExchange(
    deadGenerationExchangeName,
    'fanout',
    { durable: false },
  );

  const { queue } = await channel.assertQueue(
    generationQueueName,
    { durable: false, deadLetterExchange },
  );

  // Consume generation queue
  channel.consume(queue, (m) => onMessage(channel, m));

  logger.debug('Generation queue created');
}
