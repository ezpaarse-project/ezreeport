import type { Meta, StoryObj } from '@storybook/vue3';

import QueueList from './QueueList.vue';

const meta: Meta<typeof QueueList> = {
  title: 'Public/Queue List',
  component: QueueList,
};

export default meta;

type Story = StoryObj<typeof QueueList>;

export const Default: Story = {
  render: (args) => ({
    components: { QueueList },
    setup() {
      return { args };
    },
    template: '<QueueList v-bind="args" />',
  }),
  args: {},
};
