import type { Meta, StoryObj } from '@storybook/vue';
import mockTasks from '~/mock/tasks';
import GenerationDialog from './GenerationDialog.vue';

const meta: Meta<typeof GenerationDialog> = {
  title: 'Tasks/Internal/GenerationDialog',
  component: GenerationDialog,
  args: {
    task: mockTasks[0],
    value: true,
  },
  argTypes: {
    input: { action: 'input' },
  },
};

export default meta;

type Story = StoryObj<typeof GenerationDialog>;

export const Basic: Story = {
  render: (args) => ({
    components: { GenerationDialog },
    props: Object.keys(args),
    template: '<GenerationDialog v-bind="$props" v-on="$props" />',
  }),
};
