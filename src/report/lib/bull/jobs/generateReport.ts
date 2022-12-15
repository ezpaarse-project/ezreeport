import type Queue from 'bull';
import EventEmitter from 'node:events';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { addReportToQueue, type GenerationData } from '..';
import { generateReport } from '../../../models/reports';
import type { AnyTemplate } from '../../../models/templates';
import config from '../../config';
import { formatISO } from '../../date-fns';
import apm from '../../elastic/apm';
import logger from '../../logger';

const { outDir } = config.get('report');

export default async (job: Queue.Job<GenerationData>) => {
  const apmtrans = apm.startTransaction('generation', 'job');
  if (!apmtrans) {
    logger.warn('[bull] [generation] Can\'t start APM transaction');
  }

  const {
    id: jobId,
    data: {
      task,
      origin,
      writeHistory,
      debug,
      customPeriod,
    },
    timestamp,
  } = job;

  let expectedPageCount = 0;
  let actualPageCount = 0;
  let contact: string | undefined;

  const events = new EventEmitter();
  events.on('templateResolved', async (template: AnyTemplate) => {
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
    writeHistory,
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
      institution: task.institution,
    },
    contact,
    date: task.lastRun?.toString() ?? formatISO(new Date()),
  };

  apmtrans?.end(res.success ? 'success' : 'error');
  if (res.success && res.detail.files.report) {
    const file = await readFile(join(outDir, res.detail.files.report), 'base64');

    await addReportToQueue({
      ...base,
      success: true,
      file,
      url: `/reports/${res.detail.files.report}`,
    });
  } else {
    const file = await readFile(join(outDir, res.detail.files.detail), 'base64');

    await addReportToQueue({
      ...base,
      success: false,
      file,
      url: `/reports/${res.detail.files.detail}`,
    });
  }

  return res;
};
