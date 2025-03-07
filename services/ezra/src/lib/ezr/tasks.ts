import type { EZR } from './index.js';

type TaskListItem = any;
type Task = any;

export const createTasksReadStream = (
  ezr: EZR,
) => ezr.createDataReadStream<TaskListItem, Task>({
  type: 'tasks',
  urls: {
    list: '/tasks',
    item: (item) => `/tasks/${item.id}`,
  },
  transform: ({ activity, ...item }) => item,
});

export const createTasksWriteStream = (
  ezr: EZR,
) => ezr.createDataWriteStream<Task>({
  urls: {
    item: (item) => `/tasks/${item.id}`,
  },
  transform: (item) => ({
    name: item.name,
    description: item.description,
    template: item.template,
    targets: item.targets,
    recurrence: item.recurrence,
    nextRun: item.nextRun,
    enabled: item.enabled,
    extendedId: item.extendedId,
    namespaceId: item.namespaceId,
  }),
});
