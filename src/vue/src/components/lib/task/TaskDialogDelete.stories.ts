import type { Meta, StoryObj } from '@storybook/vue';
import tasks from '~/mock/tasks';
import TaskDialogDelete from './TaskDialogDelete.vue';

const meta: Meta<typeof TaskDialogDelete> = {
  title: 'Tasks/Internal/TaskDialogDelete',
  component: TaskDialogDelete,
  args: {
    task: tasks[0],
    value: true,
  },
  argTypes: {
    input: { action: 'input' },
    deleted: { action: 'deleted' },
  },
};

export default meta;

type Story = StoryObj<typeof TaskDialogDelete>;

export const Basic: Story = {
  render: (args) => ({
    components: { TaskDialogDelete },
    props: Object.keys(args),
    template: '<TaskDialogDelete v-bind="$props" v-on="$props" />',
  }),
};
