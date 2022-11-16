/* eslint-disable import/no-import-module-exports */
import type Queue from 'bull';
import { formatISO } from 'date-fns';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { addReportToQueue, type GenerationData } from '..';
import { generateReport } from '../../../models/reports';
import config from '../../config';
import '../../datefns'; // Setup default options for date-fns

const rootPath = config.get('rootPath');
const { outDir } = config.get('pdf');

module.exports = async (job: Queue.Job<GenerationData>) => {
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
  const res = await generateReport(
    task,
    origin,
    writeHistory,
    debug,
    {
      onLayoutResolved: async (layout) => {
        expectedPageCount = (await layout).length;
      },
      onPageAdded: async () => {
        actualPageCount += 1;
        await job.progress(actualPageCount / expectedPageCount);
      },
    },
    {
      jobId,
      jobAdded: new Date(timestamp),
    },
  );

  const base = {
    task: {
      recurrence: task.recurrence,
      name: task.name,
      targets: task.targets,
      institution: task.institution,
    },
    date: formatISO(task.lastRun ?? new Date()),
  };
  const basePath = join(rootPath, outDir, '/');

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
