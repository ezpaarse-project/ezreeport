/* eslint-disable import/no-import-module-exports */
import type Queue from 'bull';
import { formatISO } from 'date-fns';
import EventEmitter from 'node:events';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { addReportToQueue, type GenerationData } from '..';
import type { Layout } from '../../../models/layouts';
import { generateReport } from '../../../models/reports';
import config from '../../config';
import '../../datefns'; // Setup default options for date-fns
import apm from '../../elastic/apm'; // Setup Elastic's APM for monitoring
import logger from '../../logger';

const rootPath = config.get('rootPath');
const { outDir } = config.get('pdf');

module.exports = async (job: Queue.Job<GenerationData>) => {
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
    },
    timestamp,
  } = job;

  let expectedPageCount = 0;
  let actualPageCount = 0;
  let contact: string | undefined;

  const events = new EventEmitter();
  events.on('layoutResolved', async (layout: Layout) => {
    expectedPageCount = layout.length;
  });
  events.on('pageAdded', async () => {
    actualPageCount += 1;

    await job.progress(actualPageCount / expectedPageCount);
  });
  events.on('contactFound', (c: { username: string, email: string, metadata: Record<string, unknown> }) => {
    contact = c.email;
  });

  const res = await generateReport(
    task,
    origin,
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
      recurrence: task.recurrence,
      name: task.name,
      targets: task.targets,
      institution: task.institution,
    },
    contact,
    date: task.lastRun?.toString() ?? formatISO(new Date()),
  };
  const basePath = join(rootPath, outDir, '/');

  apmtrans?.end(res.success ? 'success' : 'error');
  if (res.success && res.detail.files.report) {
    const file = await readFile(join(basePath, res.detail.files.report), 'base64');

    await addReportToQueue({
      ...base,
      success: true,
      file,
      url: `/reports/${res.detail.files.report}`,
    });
  } else {
    const file = await readFile(join(basePath, res.detail.files.detail), 'base64');

    await addReportToQueue({
      ...base,
      success: false,
      file,
      url: `/reports/${res.detail.files.detail}`,
    });
  }

  return res;
};
