import type { Meta, StoryObj } from '@storybook/vue';
import mockTasks from '~/mock/tasks';
import TaskDialogGeneration from './TaskDialogGeneration.vue';

const meta: Meta<typeof TaskDialogGeneration> = {
  title: 'Tasks/Internal/Dialogs/TaskDialogGeneration',
  component: TaskDialogGeneration,
  args: {
    task: mockTasks[0],
    value: true,
  },
  argTypes: {
    input: { action: 'input' },
  },
};

export default meta;

type Story = StoryObj<typeof TaskDialogGeneration>;

export const Basic: Story = {
  render: (args) => ({
    components: { TaskDialogGeneration },
    props: Object.keys(args),
    template: '<TaskDialogGeneration v-bind="$props" v-on="$props" />',
  }),
};
