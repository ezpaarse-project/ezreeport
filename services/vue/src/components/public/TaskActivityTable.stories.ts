import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TaskActivityTable from './TaskActivityTable.vue';

const meta: Meta<typeof TaskActivityTable> = {
  component: TaskActivityTable,
  title: 'Public/Task Activity Table',
};

export default meta;

type Story = StoryObj<typeof TaskActivityTable>;

export const Default: Story = {
  args: {},
  render: (args: unknown) => ({
    components: { TaskActivityTable },
    setup() {
      return { args };
    },
    template: '<TaskActivityTable v-bind="args" />',
  }),
};
