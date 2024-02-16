import type { Meta, StoryObj } from '@storybook/vue';
import TasksPresetsCards from './TasksPresetsCards.vue';

const meta: Meta<typeof TasksPresetsCards> = {
  title: 'ezr-tasks-presets-cards (TasksPresetsCards)',
  component: TasksPresetsCards,
};

export default meta;

type Story = StoryObj<typeof TasksPresetsCards>;

export const Basic: Story = {
  render: (args) => ({
    components: { TasksPresetsCards },
    props: Object.keys(args),
    template: '<TasksPresetsCards v-bind="$props" v-on="$props" />',
  }),
};
