import type { Meta, StoryObj } from '@storybook/vue3';

import TaskActivityTable from './TaskActivityTable.vue';

const meta: Meta<typeof TaskActivityTable> = {
  title: 'Public/Task Activity Table',
  component: TaskActivityTable,
};

export default meta;

type Story = StoryObj<typeof TaskActivityTable>;

export const Default: Story = {
  render: (args) => ({
    components: { TaskActivityTable },
    setup() {
      return { args };
    },
    template: '<TaskActivityTable v-bind="args" />',
  }),
  args: {},
};
