import type { Meta, StoryObj } from '@storybook/vue';
import jobs from '~/mock/jobs';
import QueueJobDialogDetail from './QueueJobDialogDetail.vue';

const meta: Meta<typeof QueueJobDialogDetail> = {

  component: QueueJobDialogDetail,
  args: {
    value: true,
    job: jobs[0],
    queue: 'generation',
  },
  argTypes: {
    input: { action: 'input' },
  },
};

export default meta;

type Story = StoryObj<typeof QueueJobDialogDetail>;

export const Basic: Story = {
  render: (args) => ({
    components: { QueueJobDialogDetail },
    props: Object.keys(args),
    template: '<QueueJobDialogDetail v-bind="$props" v-on="$props" />',
  }),
};
