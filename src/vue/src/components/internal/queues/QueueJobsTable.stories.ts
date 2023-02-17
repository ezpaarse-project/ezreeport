import type { Meta, StoryObj } from '@storybook/vue';
import QueueJobsTable from './QueueJobsTable.vue';

const meta: Meta<typeof QueueJobsTable> = {
  title: 'Queues/Internal/Dialogs/QueueJobsTable',
  component: QueueJobsTable,
  args: {
    queue: 'generation',
  },
};

export default meta;

type Story = StoryObj<typeof QueueJobsTable>;

export const Basic: Story = {
  render: (args) => ({
    components: { QueueJobsTable },
    props: Object.keys(args),
    template: '<QueueJobsTable v-bind="$props" v-on="$props" />',
  }),
};
