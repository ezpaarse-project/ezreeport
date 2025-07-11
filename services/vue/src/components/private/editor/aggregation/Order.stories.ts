import type { Meta, StoryObj } from '@storybook/vue3-vite';

import EditorAggregationOrder from './Order.vue';

const meta: Meta<typeof EditorAggregationOrder> = {
  title: 'Template Editor/Aggregations/Order',
  component: EditorAggregationOrder,
};

export default meta;

type Story = StoryObj<typeof EditorAggregationOrder>;

export const Basic: Story = {
  render: (args) => ({
    components: { EditorAggregationOrder },
    setup() {
      return { args };
    },
    template: '<EditorAggregationOrder v-bind="args" />',
  }),
  args: {},
};

export const Readonly: Story = {
  render: (args) => ({
    components: { EditorAggregationOrder },
    setup() {
      return { args };
    },
    template: '<EditorAggregationOrder v-bind="args" />',
  }),
  args: {
    readonly: true,
  },
};
