import type { Meta, StoryObj } from '@storybook/vue';
import QueueList from './QueueList.vue';

const meta: Meta<typeof QueueList> = {
  title: 'ezr-queue-list (QueueList)',
  component: QueueList,
};

export default meta;

type Story = StoryObj<typeof QueueList>;

export const Basic: Story = {
  render: (args) => ({
    components: { QueueList },
    props: Object.keys(args),
    template: '<QueueList v-bind="$props" v-on="$props" />',
  }),
};
