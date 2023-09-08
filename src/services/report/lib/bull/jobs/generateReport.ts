import EventEmitter from 'node:events';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type Queue from 'bull';

import config from '~/lib/config';
import { formatISO } from '~/lib/date-fns';
import { appLogger as logger } from '~/lib/logger';

import { generateReport } from '~/models/reports';
import type { TemplateType } from '~/models/templates';

import { addReportToMailQueue, type GenerationData } from '..';

const { outDir } = config.report;

export default async (job: Queue.Job<GenerationData>) => {
  logger.verbose(`[bull] [${process.pid}] Received generation of "${job.data.task.name}"`);
  const {
    id: jobId,
    data: {
      task,
      origin,
      writeActivity,
      debug,
      customPeriod,
    },
    timestamp,
  } = job;

  let expectedPageCount = 0;
  let actualPageCount = 0;
  let contact: string | undefined;

  const events = new EventEmitter();
  events.on('templateResolved', async (template: TemplateType) => {
    expectedPageCount = template.layouts.length;
  });
  events.on('layoutRendered', async () => {
    actualPageCount += 1;

    await job.progress(actualPageCount / expectedPageCount);
  });
  events.on('contactFound', (c: { username: string, email: string, metadata: Record<string, unknown> }) => {
    contact = c.email;
  });

  const res = await generateReport(
    task,
    origin,
    customPeriod,
    writeActivity,
    debug,
    {
      jobId,
      jobAdded: new Date(timestamp),
    },
    events,
  );

  const base = {
    task: {
      id: task.id,
      recurrence: task.recurrence,
      name: task.name,
      targets: task.targets,
      namespace: task.namespaceId,
    },
    contact,
    date: res.detail.createdAt || formatISO(new Date()),
  };

  if (res.success && res.detail.files.report) {
    const file = await readFile(join(outDir, res.detail.files.report), 'base64');

    await addReportToMailQueue({
      ...base,
      success: true,
      file,
      url: `/reports/${res.detail.files.report}`,
    });
  } else {
    const file = await readFile(join(outDir, res.detail.files.detail), 'base64');

    await addReportToMailQueue({
      ...base,
      success: false,
      file,
      url: `/reports/${res.detail.files.detail}`,
    });
  }

  return res;
};
