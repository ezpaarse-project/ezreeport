import type { Meta, StoryObj } from '@storybook/vue';
import QueueList from './QueueList.vue';

const meta: Meta<typeof QueueList> = {
  title: 'Queues/QueueList',
  component: QueueList,
};

export default meta;

type Story = StoryObj<typeof QueueList>;

export const Basic: Story = {
  render: (args) => ({
    components: { QueueList },
    props: Object.keys(args),
    template: '<ezr-queue-list v-bind="$props" v-on="$props" />',
  }),
};