import EventEmitter from 'node:events';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { appLogger } from '~/lib/logger';
import config from '~/lib/config';
import rabbitmq, { getConnection } from '~/lib/rabbitmq';

import { GenerationQueueData, type GenerationEventDataType, type MailQueueDataType } from '~common/types/queues';
import type { GenerationStatusType } from '~common/types/reports';
import type { TemplateBodyType } from '~common/types/templates';
import { generateReport, type GenerationEventMap } from '~/models/generation';

const { outDir, team } = config.report;

const logger = appLogger.child({ scope: 'queues' });

const generationQueueName = 'ezreeport.report:generation';
const genEventExchangeName = 'ezreeport.report:event';
const sendExchangeName = 'ezreeport.report:send';

let channel: rabbitmq.Channel | undefined;
let genEventExchange: rabbitmq.Replies.AssertExchange | undefined;
let sendExchange: rabbitmq.Replies.AssertExchange | undefined;

function sendReport(type: 'mail', data: MailQueueDataType) {
  if (!channel || !sendExchange) {
    throw new Error('queues are not initialized');
  }

  channel.publish(sendExchange.exchange, type, Buffer.from(JSON.stringify(data)));
  logger.debug({
    exchange: sendExchange.exchange,
    msg: 'Mail queued',
  });
}

function sendEvent(data: GenerationEventDataType) {
  if (!channel || !genEventExchange) {
    throw new Error('queues are not initialized');
  }

  channel.publish(genEventExchange.exchange, '', Buffer.from(JSON.stringify(data)));
  logger.trace({
    exchange: genEventExchange.exchange,
    id: data.id,
    msg: 'Event sent',
  });
}

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
  let pageTotal = 0;
  let pageRendered = 0;
  const updateProgress = (status: GenerationStatusType) => {
    sendEvent({
      id: data.jobId,
      status,
      progress: pageTotal ? pageRendered / pageTotal : 0,
      updatedAt: new Date(),
    });
  };
  events.on('start', () => updateProgress('processing'));
  events.on('resolve:template', (t) => { pageTotal = (t as TemplateBodyType).layouts.length; updateProgress('processing'); });
  events.on('render:layout', () => { pageRendered += 1; updateProgress('processing'); });
  events.on('render:template', () => { pageRendered = pageTotal; updateProgress('processing'); });
  events.on('end', () => updateProgress('success'));

  // Generate report
  let result;
  try {
    result = await generateReport(data, events);
  } catch (err) {
    logger.error({
      msg: 'Error while generating report',
      err,
    });
    return;
  }

  // Send result
  const filename = result.success && result.detail.files.report
    ? result.detail.files.report
    : result.detail.files.detail;

  sendReport('mail', {
    generationId: data.jobId,
    task: data.task,
    namespace: data.namespace,

    success: result.success,
    date: result.detail.createdAt,
    period: result.detail.period,
    targets: result.detail.sendingTo || [team],

    file: await readFile(join(outDir, filename), 'base64'),
    filename,
  });
}

export default async function initQueue() {
  const start = process.uptime();

  const connection = await getConnection();

  channel = await connection.createChannel();
  await channel.prefetch(1);
  logger.debug('Channel created');

  // Create generation queue
  const generationQueue = await channel.assertQueue(generationQueueName, { durable: false });
  logger.debug({
    msg: 'Queue created',
    ...generationQueue,
  });

  // Create progress exchange
  genEventExchange = await channel.assertExchange(genEventExchangeName, 'fanout', { durable: false });
  logger.debug({
    msg: 'Progress exchange created',
    ...genEventExchange,
  });

  // Create send exchange
  sendExchange = await channel.assertExchange(sendExchangeName, 'direct', { durable: false });
  logger.debug({
    msg: 'Send exchange created',
    ...sendExchange,
  });

  // Consume generation queue
  channel.consume(
    generationQueue.queue,
    (m) => onMessage(m).then(() => m && channel!.ack(m)),
    { noAck: false },
  );

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
