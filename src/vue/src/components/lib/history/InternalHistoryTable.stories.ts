import type { Meta, StoryObj } from '@storybook/vue';
import history from '~/mock/history';
import InternalHistoryTable from './InternalHistoryTable.vue';

const meta: Meta<typeof InternalHistoryTable> = {
  title: 'History/Internal/InternalHistoryTable',
  component: InternalHistoryTable,
  args: {
    hideTask: false,
    hideInstitution: false,
    history,
  },
};

export default meta;

type Story = StoryObj<typeof InternalHistoryTable>;

export const Basic: Story = {
  render: (args) => ({
    components: { InternalHistoryTable },
    props: Object.keys(args),
    template: '<InternalHistoryTable v-bind="$props" v-on="$props" />',
  }),
};
