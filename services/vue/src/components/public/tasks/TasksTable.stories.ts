import type { Meta, StoryObj } from '@storybook/vue';
import TasksTable from './TasksTable.vue';

const meta: Meta<typeof TasksTable> = {
  title: 'ezr-task-table (TasksTable)',
  component: TasksTable,
};

export default meta;

type Story = StoryObj<typeof TasksTable>;

export const Basic: Story = {
  render: (args) => ({
    components: { TasksTable },
    props: Object.keys(args),
    template: `<TasksTable
      v-bind="$props"
      v-on="$props"
    />`,
  }),
};
