import EventEmitter from 'node:events';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { Job } from 'bullmq';

import { formatISO } from '~/lib/date-fns';
import config from '~/lib/config';
import { appLogger } from '~/lib/logger';

import generateReport from '~/models/reports/generation';
import type { NamespaceType } from '~/models/namespaces/types';
import type { TemplateBodyType } from '~/models/templates/types';
import type { ReportResultType } from '~/models/reports/types';

import { initQueues, queueMail } from '..';
import type { GenerationDataType, MailReportType } from '../types';

type Contact = {
  username: string;
  email: string;
  metadata: Record<string, unknown>;
};

const { outDir } = config.report;

export default async function generate(job: Job<GenerationDataType>): Promise<ReportResultType> {
  const logger = appLogger.child({
    scope: 'bull',
    job: job.id,
    pid: process.pid,
    taskName: job.data.task.name,
  });

  logger.debug('Received generation');
  const {
    id: jobId,
    data: {
      task,
      origin,
      period,
      shouldWriteActivity,
      debug,
    },
    timestamp,
  } = job;

  let namespace: NamespaceType | undefined;
  let expectedPageCount = 0;
  let actualPageCount = 0;
  /** * @type {string | undefined} */
  let contact: string | undefined;

  /**
   * @param namespace The used namespace
   */
  const onStart = async (n: NamespaceType) => {
    namespace = n;
  };

  /**
   * @param template The resolved template
   */
  const onTemplateResolved = (template: TemplateBodyType) => {
    expectedPageCount = template.layouts.length;
  };

  const onLayoutRendered = async () => {
    actualPageCount += 1;

    await job.updateProgress(actualPageCount / expectedPageCount);
  };

  /**
   * @param c Contact found
   */
  const onContactFound = (c: Contact) => {
    contact = c.email;
  };

  const events = new EventEmitter()
    .on('start', onStart)
    .on('templateResolved', onTemplateResolved)
    .on('layoutRendered', onLayoutRendered)
    .on('contactFound', onContactFound);

  const result = await generateReport(
    task,
    origin,
    period,
    shouldWriteActivity,
    debug,
    {
      jobId,
      jobAdded: new Date(timestamp),
    },
    events,
  );

  let mailData: MailReportType = {
    success: false,
    file: '',
    url: '',

    contact,
    date: formatISO(result.detail.createdAt),
    task: {
      id: task.id,
      recurrence: task.recurrence,
      name: task.name,
      targets: task.targets,
    },
    namespace: {
      id: namespace?.id || '',
      name: namespace?.name || 'unknown',
      logo: namespace?.logoId || undefined,
    },
    generationId: jobId || '',
  };

  if (result.success && result.detail.files.report) {
    const file = await readFile(join(outDir, result.detail.files.report), 'base64');

    mailData = {
      ...mailData,
      success: true,
      file,
      url: `/reports/${result.detail.taskId}/${result.detail.files.report}`,
    };
  } else {
    const file = await readFile(join(outDir, result.detail.files.detail), 'base64');
    mailData = {
      ...mailData,
      success: false,
      file,
      url: `/reports/${result.detail.taskId}/${result.detail.files.detail}`,
    };
  }

  initQueues(true, true);
  await queueMail(mailData);

  return result;
}
