import type { Meta, StoryObj } from '@storybook/vue';
import TaskDialogRead from './TaskDialogRead.vue';

const meta: Meta<typeof TaskDialogRead> = {
  title: 'Tasks/Internal/Dialogs/TaskDialogRead',
  component: TaskDialogRead,
  args: {
    id: '7398ffd9-ab64-48d0-a854-5f0b28b3dca9',
    value: true,
  },
  argTypes: {
    input: { action: 'input' },
    updated: { action: 'updated' },
    deleted: { action: 'deleted' },
  },
};

export default meta;

type Story = StoryObj<typeof TaskDialogRead>;

export const Basic: Story = {
  render: (args) => ({
    components: { TaskDialogRead },
    props: Object.keys(args),
    template: '<TaskDialogRead v-bind="$props" v-on="$props" />',
  }),
};
