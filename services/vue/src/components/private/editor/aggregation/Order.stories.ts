import type { Meta, StoryObj } from '@storybook/vue3-vite';

import EditorAggregationOrder from './Order.vue';

const meta: Meta<typeof EditorAggregationOrder> = {
  component: EditorAggregationOrder,
  title: 'Template Editor/Aggregations/Order',
};

type Story = StoryObj<typeof EditorAggregationOrder>;

export default meta;

export const Basic: Story = {
  args: {},
  render: (args: unknown) => ({
    components: { EditorAggregationOrder },
    setup() {
      return { args };
    },
    template: '<EditorAggregationOrder v-bind="args" />',
  }),
};

export const Readonly: Story = {
  args: {
    readonly: true,
  },
  render: (args: unknown) => ({
    components: { EditorAggregationOrder },
    setup() {
      return { args };
    },
    template: '<EditorAggregationOrder v-bind="args" />',
  }),
};
