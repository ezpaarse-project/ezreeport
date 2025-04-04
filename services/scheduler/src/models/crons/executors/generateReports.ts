import { compact } from 'lodash';

import { endOfDay } from '@ezreeport/dates';
import { calcPeriodFromRecurrence } from '@ezreeport/models/lib/periods';

import type { Executor } from '~/models/crons/types';
import { queueGeneration } from '~/models/queues/report/generation';
import { getAllNamespaces, getAllTasks, getAllTemplates } from '~/models/rpc/client/api';

const generateReports: Executor = async (logger) => {
  const today = endOfDay(Date.now());

  const tasks = await getAllTasks({ 'nextRun.to': today, enabled: true });
  const templates = await getAllTemplates();
  const namespaces = await getAllNamespaces();

  // eslint-disable-next-line no-restricted-syntax
  for (const task of tasks) {
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

    const namespace = namespaces.find((n) => n.id === task.namespaceId);
    if (!namespace) {
      logger.error({
        msg: 'Namespace not found',
        namespaceId: task.namespaceId,
        taskId: task.id,
        task: task.name,
      });
      // eslint-disable-next-line no-continue
      continue;
    }

    const template = templates.find((t) => t.id === task.extendedId);
    if (!template) {
      logger.error({
        msg: 'Template not found',
        templateId: task.extendedId,
        taskId: task.id,
        task: task.name,
      });
      // eslint-disable-next-line no-continue
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const data = await queueGeneration({
      task,
      namespace,
      template,
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
    msg: 'Generated report(s)',
    reportCounts: tasks.length,
  };
};

export default generateReports;
