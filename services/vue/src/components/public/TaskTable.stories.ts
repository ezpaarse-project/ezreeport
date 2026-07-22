import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TaskTable from './TaskTable.vue';

const meta: Meta<typeof TaskTable> = {
  component: TaskTable,
  title: 'Public/Tasks Table',
};

export default meta;

type Story = StoryObj<typeof TaskTable>;

export const Default: Story = {
  args: {},
  render: (args: unknown) => ({
    components: { TaskTable },
    setup() {
      return { args };
    },
    template: '<TaskTable v-bind="args" />',
  }),
};
