import type { Meta, StoryObj } from '@storybook/vue3-vite';

import {
  mockBucketData,
  mockFiltersData,
  mockMetricData,
  mockRawData,
} from './Form.example';
import EditorAggregationForm from './Form.vue';

const meta: Meta<typeof EditorAggregationForm> = {
  component: EditorAggregationForm,
  title: 'Template Editor/Aggregations/Form',
};

type Story = StoryObj<typeof EditorAggregationForm>;

export default meta;

export const NewMetric: Story = {
  args: {
    type: 'metric',
  },
  render: (args: unknown) => ({
    components: { EditorAggregationForm },
    setup() {
      return { args };
    },
    template: '<EditorAggregationForm v-bind="args" />',
  }),
};

export const ExistingMetric: Story = {
  args: {
    modelValue: mockMetricData,
    type: 'metric',
  },
  render: (args: unknown) => ({
    components: { EditorAggregationForm },
    setup() {
      return { args };
    },
    template: '<EditorAggregationForm v-bind="args" />',
  }),
};

export const NewBucket: Story = {
  args: {
    type: 'bucket',
  },
  render: (args: unknown) => ({
    components: { EditorAggregationForm },
    setup() {
      return { args };
    },
    template: '<EditorAggregationForm v-bind="args" />',
  }),
};

export const ExistingBucket: Story = {
  args: {
    modelValue: mockBucketData,
    type: 'bucket',
  },
  render: (args: unknown) => ({
    components: { EditorAggregationForm },
    setup() {
      return { args };
    },
    template: '<EditorAggregationForm v-bind="args" />',
  }),
};

export const ExistingRaw: Story = {
  args: {
    modelValue: mockRawData,
  },
  render: (args: unknown) => ({
    components: { EditorAggregationForm },
    setup() {
      return { args };
    },
    template: '<EditorAggregationForm v-bind="args" />',
  }),
};

export const ExistingFilters: Story = {
  args: {
    modelValue: mockFiltersData,
  },
  render: (args: unknown) => ({
    components: { EditorAggregationForm },
    setup() {
      return { args };
    },
    template: '<EditorAggregationForm v-bind="args" />',
  }),
};

export const Readonly: Story = {
  args: {
    modelValue: mockBucketData,
    readonly: true,
    type: 'bucket',
  },
  render: (args: unknown) => ({
    components: { EditorAggregationForm },
    setup() {
      return { args };
    },
    template: '<EditorAggregationForm v-bind="args" />',
  }),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    modelValue: mockBucketData,
    type: 'bucket',
  },
  render: (args: unknown) => ({
    components: { EditorAggregationForm },
    setup() {
      return { args };
    },
    template: '<EditorAggregationForm v-bind="args" />',
  }),
};
