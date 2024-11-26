import type { Job } from 'bullmq';
import type { Logger } from 'pino';

import { endOfDay, startOfDay } from '~/lib/date-fns';

import type { CronDataType } from '~/models/crons/types';
import { getAllTasks } from '~/models/tasks';
import { queueGeneration } from '~/models/queues';

export default async function queueReports(job: Job<CronDataType>, logger: Logger) {
  const start = Date.now();
  logger.debug('Started');

  try {
    const tasks = await getAllTasks({
      'nextRun.from': startOfDay(start),
      'nextRun.to': endOfDay(start),
    });

    const { length } = await Promise.all(
      tasks.map(
        async (task, i, arr) => {
          await queueGeneration({
            task,
            origin: 'daily-cron-job',
          });
          await job.updateProgress(i / arr.length);
        },
      ),
    );

    const end = Date.now();
    logger.info({
      reportCounts: length,
      cronDuration: end - start,
      cronDurationUnit: 'ms',
      msg: 'Generated report(s)',
    });
  } catch (err) {
    const end = Date.now();
    logger.error({
      cronDuration: end - start,
      cronDurationUnit: 'ms',
      err,
      msg: 'Failed to generate report(s)',
    });
    throw err;
  }
}
