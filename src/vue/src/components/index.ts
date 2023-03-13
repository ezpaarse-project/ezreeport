import StatusList from './public/health/StatusList.vue';
import CronList from './public/crons/CronList.vue';
import TasksTable from './public/tasks/TasksTable.vue';
import HistoryTable from './public/history/HistoryTable.vue';
import TemplateList from './public/templates/TemplateList.vue';
import QueueList from './public/queues/QueueList.vue';

export default {
  'ezr-status-list': StatusList,
  'ezr-cron-list': CronList,
  'ezr-task-table': TasksTable,
  'ezr-history-table': HistoryTable,
  'ezr-template-list': TemplateList,
  'ezr-queue-list': QueueList,
};
