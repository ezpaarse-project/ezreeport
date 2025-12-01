import type { App } from 'vue';

import EzrCronList from '~/components/public/CronList.vue';
import EzrHealthStatus from '~/components/public/HealthStatus.vue';
import EzrGenerationTable from '~/components/public/GenerationTable.vue';
import EzrTaskActivityTable from '~/components/public/TaskActivityTable.vue';
import EzrTaskCards from '~/components/public/TaskCards.vue';
import EzrTaskPresetTable from '~/components/public/TaskPresetTable.vue';
import EzrTaskTable from '~/components/public/TaskTable.vue';
import EzrTemplateTable from '~/components/public/TemplateTable.vue';
import EzrTemplateTagTable from '~/components/public/TemplateTagTable.vue';

declare module 'vue' {
  // oxlint-disable-next-line consistent-type-definitions
  export interface GlobalComponents {
    EzrCronList: typeof EzrCronList;
    EzrHealthStatus: typeof EzrHealthStatus;
    /** @deprecated use `EzrGenerationTable` */
    EzrQueueList: typeof EzrGenerationTable;
    EzrGenerationTable: typeof EzrGenerationTable;
    EzrTaskActivityTable: typeof EzrTaskActivityTable;
    EzrTaskCards: typeof EzrTaskCards;
    EzrTaskPresetTable: typeof EzrTaskPresetTable;
    EzrTaskTable: typeof EzrTaskTable;
    EzrTemplateTable: typeof EzrTemplateTable;
    EzrTemplateTagTable: typeof EzrTemplateTagTable;
  }
}

export function registerComponents(app: App): void {
  app.component('ezr-cron-list', EzrCronList);
  app.component('ezr-health-status', EzrHealthStatus);
  /** @deprecated use `EzrGenerationTable` */
  app.component('ezr-queue-list', EzrGenerationTable);
  app.component('ezr-generation-table', EzrGenerationTable);
  app.component('ezr-task-activity-table', EzrTaskActivityTable);
  app.component('ezr-task-cards', EzrTaskCards);
  app.component('ezr-task-preset-table', EzrTaskPresetTable);
  app.component('ezr-task-table', EzrTaskTable);
  app.component('ezr-template-table', EzrTemplateTable);
  app.component('ezr-template-tag-table', EzrTemplateTagTable);
}
