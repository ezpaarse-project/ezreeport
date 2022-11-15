/* eslint-disable import/no-import-module-exports */
import type Queue from 'bull';
import type { GenerationData } from '..';
import { generateReport } from '../../../models/reports';
import '../../datefns'; // Setup default options for date-fns

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

  if (res.success) {
    // TODO[feat]: put in queue for email
  }

  return res;
};
