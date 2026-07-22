import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { createMetricFigureHelper } from '~sdk/helpers/figures';

import { mockData, mockFilters } from './Metric.example';
import EditorFigureMetric from './Metric.vue';

const meta: Meta<typeof EditorFigureMetric> = {
  component: EditorFigureMetric,
  title: 'Template Editor/Figures/Metric',
};

type Story = StoryObj<typeof EditorFigureMetric>;
export default meta;

export const New: Story = {
  args: {
    modelValue: createMetricFigureHelper(),
  },
  render: (args: unknown) => ({
    components: { EditorFigureMetric },
    setup() {
      return { args };
    },
    template: '<EditorFigureMetric v-bind="args" />',
  }),
};

export const Existing: Story = {
  args: {
    modelValue: createMetricFigureHelper(mockData, mockFilters),
  },
  render: (args: unknown) => ({
    components: { EditorFigureMetric },
    setup() {
      return { args };
    },
    template: '<EditorFigureMetric v-bind="args" />',
  }),
};

export const Readonly: Story = {
  args: {
    modelValue: createMetricFigureHelper(mockData, mockFilters),
    readonly: true,
  },
  render: (args: unknown) => ({
    components: { EditorFigureMetric },
    setup() {
      return { args };
    },
    template: '<EditorFigureMetric v-bind="args" />',
  }),
};
