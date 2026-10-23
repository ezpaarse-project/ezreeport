import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import TaskTable from './TaskTable.vue';

const meta: Meta<typeof TaskTable> = {
  component: TaskTable,
  title: 'Public/Tasks Table',
};

const { defineStory } = useStory(meta);

export default meta;

export const Default = defineStory({});
