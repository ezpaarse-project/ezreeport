import type { Meta, StoryObj } from '@storybook/vue3';

import type { FigureAggregation } from '~sdk/helpers/aggregations';

import EditorAggregationForm from './Form.vue';

const meta: Meta<typeof EditorAggregationForm> = {
  title: 'Template Editor/Aggregations/Form',
  component: EditorAggregationForm,
};

export default meta;

type Story = StoryObj<typeof EditorAggregationForm>;

const mockMetricData: FigureAggregation = {
  type: 'sum',
  field: 'Count',
};

const mockBucketData: FigureAggregation = {
  type: 'date_histogram',
  field: 'datetime',
};

export const NewMetric: Story = {
  render: (args) => ({
    components: { EditorAggregationForm },
    setup() {
      return { args };
    },
    template: '<EditorAggregationForm v-bind="args" />',
  }),
  args: {
    type: 'metric',
  },
};

export const ExistingMetric: Story = {
  render: (args) => ({
    components: { EditorAggregationForm },
    setup() {
      return { args };
    },
    template: '<EditorAggregationForm v-bind="args" />',
  }),
  args: {
    modelValue: mockMetricData,
    type: 'metric',
  },
};

export const NewBucket: Story = {
  render: (args) => ({
    components: { EditorAggregationForm },
    setup() {
      return { args };
    },
    template: '<EditorAggregationForm v-bind="args" />',
  }),
  args: {
    type: 'bucket',
  },
};

export const ExistingBucket: Story = {
  render: (args) => ({
    components: { EditorAggregationForm },
    setup() {
      return { args };
    },
    template: '<EditorAggregationForm v-bind="args" />',
  }),
  args: {
    modelValue: mockBucketData,
    type: 'bucket',
  },
};

export const Readonly: Story = {
  render: (args) => ({
    components: { EditorAggregationForm },
    setup() {
      return { args };
    },
    template: '<EditorAggregationForm v-bind="args" />',
  }),
  args: {
    modelValue: mockBucketData,
    readonly: true,
    type: 'bucket',
  },
};

export const Disabled: Story = {
  render: (args) => ({
    components: { EditorAggregationForm },
    setup() {
      return { args };
    },
    template: '<EditorAggregationForm v-bind="args" />',
  }),
  args: {
    modelValue: mockBucketData,
    disabled: true,
    type: 'bucket',
  },
};
