import type Queue from 'bull';
import { endOfDay, isBefore } from 'date-fns';
import type { CronData } from '..';
import { getAllTasks } from '../../../models/tasks';
import { addTaskToQueue } from '../../bull';
import logger from '../../logger';
import { formatInterval } from '../../utils';
import { sendError } from './utils';

export default async (job: Queue.Job<CronData>) => {
  const start = new Date();
  logger.debug(`[cron] [${job.name}] Started`);
  try {
    const tasks = await getAllTasks();
    // Getting end of today, to ignore hour of task's nextRun
    const today = endOfDay(start);

    const { length } = await Promise.all(
      tasks.filter(
        (task) => task.enabled && isBefore(task.nextRun, today),
      ).map(
        async (task, i, arr) => {
          await addTaskToQueue({ task, origin: 'daily-cron-job' });
          await job.progress(i / arr.length);
        },
      ),
    );
    const dur = formatInterval({ start, end: new Date() });
    logger.info(`[cron] [${job.name}] Generated ${length} report(s) in ${dur}s`);
  } catch (error) {
    const dur = formatInterval({ start, end: new Date() });
    logger.error(`[cron] Job ${job.name} failed in ${dur}s with error: ${(error as Error).message}`);
    await sendError(error as Error, 'index', job.data.timer);
  }
};
