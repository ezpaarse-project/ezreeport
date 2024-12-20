import type { EZR } from './index.js';

type TaskPresetListItem = any;
type TaskPreset = any;

export const createTaskPresetsReadStream = (
  ezr: EZR,
) => ezr.createDataReadStream<
TaskPresetListItem,
TaskPreset
>({
  type: 'tasks presets',
  urls: {
    list: '/task-presets',
    item: (item) => `/task-presets/${item.id}`,
  },
});

export const createTaskPresetsWriteStream = (
  ezr: EZR,
) => ezr.createDataWriteStream<TaskPreset>({
  urls: {
    item: (item) => `/task-presets/${item.id}`,
  },
  transform: (item) => ({
    name: item.name,
    hidden: item.hidden,
    fetchOptions: item.fetchOptions,
    recurrence: item.recurrence,
    templateId: item.templateId,
  }),
});
