import { endOfDay, isBefore } from 'date-fns';
import { getAllTasks } from '../../../../models/tasks';
import { addTaskToQueue } from '../../../bull';
import logger from '../../../logger';
import { formatInterval } from '../../../utils';

export default async () => {
  const start = new Date();
  try {
    const tasks = await getAllTasks();
    // Getting end of today, to ignore hour of task's nextRun
    const today = endOfDay(start);

    const { length } = await Promise.all(
      tasks.filter(
        (task) => task.enabled && isBefore(task.nextRun, today),
      ).map(
        (task) => addTaskToQueue({ task, origin: 'daily-cron-job' }),
      ),
    );
    const dur = formatInterval({ start, end: new Date() });
    logger.info(`[cron] [daily-report] Generated ${length} report(s) in ${dur}s`);
  } catch (error) {
    const dur = formatInterval({ start, end: new Date() });
    logger.error(`[cron] [daily-report] Job failed in ${dur}s with error: ${(error as Error).message}`);
    throw error;
  }
};
