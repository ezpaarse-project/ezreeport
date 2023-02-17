import StatusList from './components/public/health/StatusList.vue';
import CronList from './components/public/crons/CronList.vue';
import TasksTable from './components/public/tasks/TasksTable.vue';
import HistoryTable from './components/public/history/HistoryTable.vue';
import TemplateList from './components/public/templates/TemplateList.vue';
import QueueList from './components/public/queues/QueueList.vue';

export default {
  'ezr-status-list': StatusList,
  'ezr-cron-list': CronList,
  'ezr-task-table': TasksTable,
  'ezr-history-table': HistoryTable,
  'ezr-template-list': TemplateList,
  'ezr-queue-list': QueueList,
};
