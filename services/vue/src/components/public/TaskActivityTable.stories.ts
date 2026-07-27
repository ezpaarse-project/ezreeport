import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import TaskActivityTable from './TaskActivityTable.vue';

const meta: Meta<typeof TaskActivityTable> = {
  component: TaskActivityTable,
  title: 'Public/Task Activity Table',
};

const { defineStory } = useStory(meta);

export default meta;

export const Default = defineStory({});
