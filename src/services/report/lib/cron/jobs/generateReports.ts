import type Queue from 'bull';

import { addTaskToGenQueue } from '~/lib/bull';
import { endOfDay } from '~/lib/date-fns';
import { appLogger as logger } from '~/lib/logger';
import { formatInterval } from '~/lib/utils';

import { getAllTasksToGenerate } from '~/models/tasks';

import type { CronData } from '..';
import { sendError } from './utils';

export default async (job: Queue.Job<CronData>) => {
  const start = new Date();
  logger.verbose(`[cron] [${process.pid}] [${job.name}] Started`);

  try {
    // Getting end of today, to ignore hour of task's nextRun
    const today = endOfDay(start);
    const tasks = await getAllTasksToGenerate(today);

    const { length } = await Promise.all(
      tasks.map(
        async (task, i, arr) => {
          await addTaskToGenQueue({ task, origin: 'daily-cron-job' });
          await job.progress(i / arr.length);
        },
      ),
    );

    const dur = formatInterval({ start, end: new Date() });
    logger.info(`[cron] [${process.pid}] [${job.name}] Generated [${length}] report(s) in [${dur}]s`);
  } catch (error) {
    const dur = formatInterval({ start, end: new Date() });
    logger.error(`[cron] [${process.pid}] [${job.name}] Job failed in [${dur}]s with error: {${(error as Error).message}}`);
    await sendError(error as Error, job.name, job.data.timer);
  }
};
