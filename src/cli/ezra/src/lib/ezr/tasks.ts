import * as ezr from './index.js';

type TaskListItem = any;
type Task = any;

export const getTasksStream = () => ezr.getDataAsStream<TaskListItem, Task>({
  labels: {
    start: 'Getting tasks',
    end: (count) => `${count} tasks found`,
  },
  urls: {
    list: '/tasks',
    item: (item) => `/tasks/${item.id}`,
  },
  transform: ({ activity, ...item }) => item,
});
export const applyTasksStream = () => ezr.applyStreamAsData<Task>({
  urls: {
    item: (item) => `/tasks/${item.id}`,
  },
  labels: {
    start: 'Applying tasks',
    end: (count) => `${count} tasks applied`,
  },
  transform: (item) => ({
    name: item.name,
    template: item.template,
    targets: item.targets,
    recurrence: item.recurrence,
    nextRun: item.nextRun,
    enabled: item.enabled,
    extends: item.extends.id,
    namespace: item.namespace.id,
  }),
});
