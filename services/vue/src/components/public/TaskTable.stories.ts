import type { Meta, StoryObj } from '@storybook/vue3';

import TaskTable from './TaskTable.vue';

const meta: Meta<typeof TaskTable> = {
  title: 'Public/Tasks Table',
  component: TaskTable,
};

export default meta;

type Story = StoryObj<typeof TaskTable>;

export const Default: Story = {
  render: (args) => ({
    components: { TaskTable },
    setup() {
      return { args };
    },
    template: '<TaskTable v-bind="args" />',
  }),
  args: {},
};
