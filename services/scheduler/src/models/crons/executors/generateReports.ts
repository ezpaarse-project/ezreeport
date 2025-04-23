import { compact } from 'lodash';

import type { Executor } from '@ezreeport/crons/types';
import { Task } from '@ezreeport/models/tasks';
import { Namespace } from '@ezreeport/models/namespaces';
import { Template } from '@ezreeport/models/templates';
import { calcPeriodFromRecurrence } from '@ezreeport/models/lib/periods';

import { queueGeneration } from '~/models/queues/report/generation';
import { getTasksToGenerate } from '~/models/tasks';

const generateReports: Executor = async (logger) => {
  const today = new Date();

  const tasks = await getTasksToGenerate(today);

  // eslint-disable-next-line no-restricted-syntax
  for (const { namespace, extends: template, ...task } of tasks) {
    // Resolve targets
    const targets = compact(task.targets);
    if (targets.length <= 0) {
      logger.error({
        msg: 'Targets can\'t be null',
        taskId: task.id,
        task: task.name,
      });
      // eslint-disable-next-line no-continue
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const data = await queueGeneration({
      task: Task.parse(task),
      namespace: Namespace.parse(namespace),
      template: Template.parse(template),
      period: calcPeriodFromRecurrence(today, task.recurrence, -1),
      targets,
      origin: 'scheduler',
      writeActivity: {
        jobAdded: new Date(),
      },
    });

    if (data) {
      logger.debug({
        msg: 'Report queued for generation',
        namespace: namespace.name,
        templateId: task.extendedId,
        template: template.name,
        taskId: task.id,
        task: task.name,
      });
    }
  }

  return {
    msg: 'Queued report(s)',
    reportCounts: tasks.length,
  };
};

export default generateReports;
