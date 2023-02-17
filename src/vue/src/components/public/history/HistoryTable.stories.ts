import type { Meta, StoryObj } from '@storybook/vue';
import HistoryTable from './HistoryTable.vue';

const meta: Meta<typeof HistoryTable> = {
  title: 'History/HistoryTable',
  component: HistoryTable,
};

export default meta;

type Story = StoryObj<typeof HistoryTable>;

export const Basic: Story = {
  render: (args) => ({
    components: { HistoryTable },
    props: Object.keys(args),
    template: '<ezr-history-table v-bind="$props" v-on="$props" />',
  }),
};
