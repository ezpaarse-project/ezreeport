import type { Meta, StoryObj } from '@storybook/vue3';

import TaskCards from './TaskCards.vue';

const meta: Meta<typeof TaskCards> = {
  title: 'Public/Tasks Cards',
  component: TaskCards,
};

export default meta;

type Story = StoryObj<typeof TaskCards>;

export const Default: Story = {
  render: (args) => ({
    components: { TaskCards },
    setup() {
      return { args };
    },
    template: '<TaskCards v-bind="args" />',
  }),
  args: {
    namespaceId: 'abba8400-1216-11eb-af77-ff33b5dd411e',
  },
};
