import type { Meta, StoryObj } from '@storybook/vue';
import TasksActivityTable from './TasksActivityTable.vue';

const meta: Meta<typeof TasksActivityTable> = {
  title: 'ezr-tasks-activity-table (TasksActivityTable)',
  component: TasksActivityTable,
  args: {
    fetchInterval: 5000,
  },
};

export default meta;

type Story = StoryObj<typeof TasksActivityTable>;

export const Basic: Story = {
  render: (args) => ({
    components: { TasksActivityTable },
    props: Object.keys(args),
    template: '<TasksActivityTable v-bind="$props" v-on="$props" />',
  }),
};
