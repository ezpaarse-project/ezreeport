import { compact } from 'lodash';

import type { Executor } from '@ezreeport/crons/types';
import { calcPeriodFromRecurrence } from '@ezreeport/models/lib/periods';
import { Namespace } from '@ezreeport/models/namespaces';
import { Task } from '@ezreeport/models/tasks';
import { Template } from '@ezreeport/models/templates';

import { queueGeneration } from '~/models/queues/report/generation';
import { getTasksToGenerate } from '~/models/tasks';

const generateReports: Executor = async (logger) => {
  const today = new Date();

  const tasks = await getTasksToGenerate(today);

  for (const { namespace, extends: template, ...task } of tasks) {
    // Resolve targets
    const targets = compact(task.targets);
    if (targets.length <= 0) {
      logger.error({
        msg: "Targets can't be null",
        task: task.name,
        taskId: task.id,
      });
      continue;
    }

    // oxlint-disable-next-line no-await-in-loop
    const data = await queueGeneration({
      namespace: Namespace.parse(namespace),
      origin: 'scheduler',
      period: calcPeriodFromRecurrence(today, task.recurrence, -1),
      targets,
      task: Task.parse(task),
      template: Template.parse(template),
      writeActivity: {
        jobAdded: new Date(),
      },
    });

    if (data) {
      logger.debug({
        msg: 'Report queued for generation',
        namespace: namespace.name,
        task: task.name,
        taskId: task.id,
        template: template.name,
        templateId: task.extendedId,
      });
    }
  }

  return {
    msg: 'Queued report(s)',
    reportCounts: tasks.length,
  };
};

// oxlint-disable-next-line import/no-default-export
export default generateReports;
