import type { Meta, StoryObj } from '@storybook/vue';
import TasksPresetsList from './TasksPresetsList.vue';

const meta: Meta<typeof TasksPresetsList> = {
  title: 'ezr-tasks-presets-list (TasksPresetsList)',
  component: TasksPresetsList,
};

export default meta;

type Story = StoryObj<typeof TasksPresetsList>;

export const Basic: Story = {
  render: (args) => ({
    components: { TasksPresetsList },
    props: Object.keys(args),
    template: '<TasksPresetsList v-bind="$props" v-on="$props" />',
  }),
};
