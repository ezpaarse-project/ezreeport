import { endOfDay, isBefore } from 'date-fns';
import { getAllTasks } from '../../../models/tasks';
import { addTaskToQueue } from '../../bull';

export default async () => {
  const tasks = await getAllTasks();
  // Getting end of today, to ignore hour of task's nextRun
  const today = endOfDay(new Date());

  return Promise.all(
    tasks.filter(
      (task) => task.enabled && isBefore(task.nextRun, today),
    ).map(
      (task) => addTaskToQueue(task, 'daily-cron-job'),
    ),
  );
};
