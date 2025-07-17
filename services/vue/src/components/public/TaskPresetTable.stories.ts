import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TaskPresetTable from './TaskPresetTable.vue';

const meta: Meta<typeof TaskPresetTable> = {
  title: 'Public/Task Presets Table',
  component: TaskPresetTable,
};

export default meta;

type Story = StoryObj<typeof TaskPresetTable>;

export const Default: Story = {
  render: (args) => ({
    components: { TaskPresetTable },
    setup() {
      return { args };
    },
    template: '<TaskPresetTable v-bind="args" />',
  }),
  args: {},
};
