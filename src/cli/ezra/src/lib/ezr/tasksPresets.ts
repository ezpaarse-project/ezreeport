import { EZR } from './index.js';

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
    list: '/tasks-presets',
    item: (item) => `/tasks-presets/${item.id}`,
  },
});

export const createTaskPresetsWriteStream = (
  ezr: EZR,
) => ezr.createDataWriteStream<TaskPreset>({
  urls: {
    item: (item) => `/tasks-presets/${item.id}`,
  },
  transform: (item) => ({
    name: item.name,
    fetchOptions: item.fetchOptions,
    recurrence: item.recurrence,
    template: item.template.id,
  }),
});
