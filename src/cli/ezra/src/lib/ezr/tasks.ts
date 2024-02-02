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
