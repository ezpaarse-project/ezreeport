import EzrCronList from '~/components/public/CronList.vue';
import EzrHealthStatus from '~/components/public/HealthStatus.vue';
import EzrGenerationTable from '~/components/public/GenerationTable.vue';
import EzrTaskActivityTable from '~/components/public/TaskActivityTable.vue';
import EzrTaskCards from '~/components/public/TaskCards.vue';
import EzrTaskPresetTable from '~/components/public/TaskPresetTable.vue';
import EzrTaskTable from '~/components/public/TaskTable.vue';
import EzrTemplateTable from '~/components/public/TemplateTable.vue';

/** @deprecated use `EzrGenerationTable` */
export const EzrQueueList = EzrGenerationTable;

export {
  EzrCronList,
  EzrHealthStatus,
  EzrGenerationTable,
  EzrTaskActivityTable,
  EzrTaskCards,
  EzrTaskPresetTable,
  EzrTaskTable,
  EzrTemplateTable,
};
