import * as ezr from './index.js';

type TaskPresetListItem = any;
type TaskPreset = any;

export const getTaskPresetsStream = () => ezr.getDataAsStream<TaskPresetListItem, TaskPreset>({
  labels: {
    start: 'Getting tasks presets',
    end: (count) => `${count} tasks presets found`,
  },
  urls: {
    list: '/tasks-presets',
    item: (item) => `/tasks-presets/${item.id}`,
  },
});
export const applyTaskPresetsStream = () => ezr.applyStreamAsData<TaskPreset>({
  urls: {
    item: (item) => `/tasks-presets/${item.id}`,
  },
  labels: {
    start: 'Applying tasks presets',
    end: (count) => `${count} tasks presets applied`,
  },
  transform: (item) => ({
    name: item.name,
    fetchOptions: item.fetchOptions,
    recurrence: item.recurrence,
    template: item.template.id,
  }),
});
