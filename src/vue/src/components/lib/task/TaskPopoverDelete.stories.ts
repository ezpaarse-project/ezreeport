import type { Meta, StoryObj } from '@storybook/vue';
import tasks from '~/mock/tasks';
import TaskPopoverDelete from './TaskPopoverDelete.vue';

const meta: Meta<typeof TaskPopoverDelete> = {
  title: 'Tasks/Internal/TaskPopoverDelete',
  component: TaskPopoverDelete,
  args: {
    task: tasks[0],
    value: true,
    coords: {
      x: 0,
      y: 0,
    },
  },
  argTypes: {
    input: { action: 'input' },
    deleted: { action: 'deleted' },
  },
};

export default meta;

type Story = StoryObj<typeof TaskPopoverDelete>;

export const Basic: Story = {
  render: (args) => ({
    components: { TaskPopoverDelete },
    props: Object.keys(args),
    template: '<TaskPopoverDelete v-bind="$props" v-on="$props" />',
  }),
};
