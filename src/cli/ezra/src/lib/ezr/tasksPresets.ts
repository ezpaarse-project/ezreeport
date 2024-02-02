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
