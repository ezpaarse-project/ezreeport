import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import TaskPresetTable from './TaskPresetTable.vue';

const meta: Meta<typeof TaskPresetTable> = {
  component: TaskPresetTable,
  title: 'Public/Task Presets Table',
};

const { defineStory } = useStory(meta);

export default meta;

export const Default = defineStory({});
