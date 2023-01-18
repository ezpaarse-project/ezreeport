import type { Meta, StoryObj } from '@storybook/vue';
import TaskDialog from './TaskDialog.vue';

const meta: Meta<typeof TaskDialog> = {
  title: 'Tasks/Internal/TaskDialog',
  component: TaskDialog,
  args: {
    id: '7398ffd9-ab64-48d0-a854-5f0b28b3dca9',
    show: true,
  },
  argTypes: {
    'update:show': { action: 'update:show' },
    initialMode: { control: false },
  },
};

export default meta;

type Story = StoryObj<typeof TaskDialog>;

export const Basic: Story = {
  render: (args) => ({
    components: { TaskDialog },
    props: Object.keys(args),
    template: '<TaskDialog v-bind="$props" v-on="$props" />',
  }),
};
