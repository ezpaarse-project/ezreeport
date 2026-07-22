import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TaskPresetTable from './TaskPresetTable.vue';

const meta: Meta<typeof TaskPresetTable> = {
  component: TaskPresetTable,
  title: 'Public/Task Presets Table',
};

export default meta;

type Story = StoryObj<typeof TaskPresetTable>;

export const Default: Story = {
  args: {},
  render: (args: unknown) => ({
    components: { TaskPresetTable },
    setup() {
      return { args };
    },
    template: '<TaskPresetTable v-bind="args" />',
  }),
};
