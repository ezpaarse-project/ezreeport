import EventEmitter from 'node:events';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';
import config from '~/lib/config';
import { gzipAsync } from '~/lib/gzip';

import { GenerationQueueData } from '~common/types/queues';
import type { TemplateBodyType } from '~common/types/templates';
import type { GenerationStatusType } from '~common/types/generations';
import type { ReportResultType } from '~common/types/reports';
import { generateReport, type GenerationEventMap } from '~/models/generation';

import { sendEvent } from './event';
import { sendReport } from './send';

const { outDir, team } = config.report;

const generationQueueName = 'ezreeport.report:queues';

const logger = appLogger.child({ scope: 'queues', queue: generationQueueName });

let generationQueue: rabbitmq.Replies.AssertQueue | undefined;

async function onMessage(msg: rabbitmq.ConsumeMessage | null) {
  if (!msg) {
    return;
  }

  // Parse message
  const raw = JSON.parse(msg.content.toString());
  let data;
  try {
    data = await GenerationQueueData.parseAsync(raw);
  } catch (err) {
    logger.error({
      msg: 'Invalid data',
      data: process.env.NODE_ENV === 'production' ? undefined : raw,
      err,
    });
    return;
  }

  // Setup events
  const events = new EventEmitter<GenerationEventMap>();
  let startTime = 0;
  let pageTotal = 0;
  let pageRendered = 0;
  const updateProgress = (status: GenerationStatusType) => sendEvent({
    id: data.id,
    taskId: data.task.id,
    start: data.period.start,
    end: data.period.end,
    origin: data.origin,
    targets: data.targets,
    writeActivity: !!data.writeActivity,
    status,
    progress: pageTotal ? Math.round((pageRendered / pageTotal) * 100) : undefined,
    took: startTime ? Date.now() - startTime : undefined,
    createdAt: new Date(startTime || Date.now()),
    updatedAt: new Date(),
  });
  events.on('start', () => {
    startTime = Date.now();
    updateProgress('PROCESSING');
  });
  events.on('resolve:template', (t) => {
    pageTotal = (t as TemplateBodyType).layouts.length;
    updateProgress('PROCESSING');
  });
  events.on('render:layout', () => {
    pageRendered += 1;
    updateProgress('PROCESSING');
  });
  events.on('render:template', () => {
    pageRendered = pageTotal;
    updateProgress('PROCESSING');
  });
  events.on('end', (r) => {
    const status = (r as ReportResultType).success ? 'SUCCESS' : 'ERROR';
    updateProgress(status);
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
    return;
  }

  // Send result
  const filename = result.success && result.detail.files.report
    ? result.detail.files.report
    : result.detail.files.detail;

  try {
    const file = await readFile(join(outDir, filename));
    const compressed = await gzipAsync(file);

    sendReport('mail', {
      generationId: data.id,
      task: data.task,
      namespace: data.namespace,

      success: result.success,
      date: result.detail.createdAt,
      period: result.detail.period,
      targets: result.detail.sendingTo || [team],

      file: compressed.toString('base64'),
      filename,
    });
  } catch (err) {
    logger.error({
      jobId: data.id,
      msg: 'Error while sending report',
      err,
    });
  }
}

// eslint-disable-next-line import/prefer-default-export
export async function getReportGenerationQueue(channel: rabbitmq.Channel) {
  if (!generationQueue) {
    generationQueue = await channel.assertQueue(generationQueueName, { durable: false });

    // Consume generation queue
    channel.consume(
      generationQueue.queue,
      (m) => onMessage(m).then(() => m && channel.ack(m)),
      { noAck: false },
    );

    logger.debug('Generation queue created');
  }
  return generationQueue;
}
