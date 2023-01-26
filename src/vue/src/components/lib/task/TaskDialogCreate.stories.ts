import type { Meta, StoryObj } from '@storybook/vue';
import TaskDialogCreate from './TaskDialogCreate.vue';

const meta: Meta<typeof TaskDialogCreate> = {
  title: 'Tasks/Internal/TaskDialogCreate',
  component: TaskDialogCreate,
  args: {
    value: true,
  },
  argTypes: {
    input: { action: 'input' },
    created: { action: 'created' },
  },
};

export default meta;

type Story = StoryObj<typeof TaskDialogCreate>;

export const Basic: Story = {
  render: (args) => ({
    components: { TaskDialogCreate },
    props: Object.keys(args),
    template: '<TaskDialogCreate v-bind="$props" v-on="$props" />',
  }),
};
