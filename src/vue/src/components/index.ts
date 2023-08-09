import StatusList from './public/health/StatusList.vue';
import CronList from './public/crons/CronList.vue';
import TasksTable from './public/tasks/TasksTable.vue';
import TasksActivityTable from './public/history/TasksActivityTable.vue';
import TemplateList from './public/templates/TemplateList.vue';
import QueueList from './public/queues/QueueList.vue';
import Provider from './public/EzrProvider.vue';

export default {
  'ezr-status-list': StatusList,
  'ezr-cron-list': CronList,
  'ezr-task-table': TasksTable,
  /** @deprecated Use `ezr-tasks-activity-table` */
  'ezr-history-table': TasksActivityTable,
  'ezr-tasks-activity-table': TasksActivityTable,
  'ezr-template-list': TemplateList,
  'ezr-queue-list': QueueList,
  'ezr-provider': Provider,
};
