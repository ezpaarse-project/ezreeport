import type { Meta, StoryObj } from '@storybook/vue';
import TaskDialogUpdate from './TaskDialogUpdate.vue';

const meta: Meta<typeof TaskDialogUpdate> = {

  component: TaskDialogUpdate,
  args: {
    id: '7398ffd9-ab64-48d0-a854-5f0b28b3dca9',
    value: true,
  },
  argTypes: {
    input: { action: 'input' },
    updated: { action: 'updated' },
  },
};

export default meta;

type Story = StoryObj<typeof TaskDialogUpdate>;

export const Basic: Story = {
  render: (args) => ({
    components: { TaskDialogUpdate },
    props: Object.keys(args),
    template: '<TaskDialogUpdate v-bind="$props" v-on="$props" />',
  }),
};
