import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TaskCards from './TaskCards.vue';

const meta: Meta<typeof TaskCards> = {
  component: TaskCards,
  title: 'Public/Tasks Cards',
};

export default meta;

type Story = StoryObj<typeof TaskCards>;

export const Default: Story = {
  args: {
    namespaceId: 'abba8400-1216-11eb-af77-ff33b5dd411e',
  },
  render: (args: unknown) => ({
    components: { TaskCards },
    setup() {
      return { args };
    },
    template: '<TaskCards v-bind="args" />',
  }),
};
