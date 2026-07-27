import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { MetricLabel } from '~sdk/helpers/figures';

import EditorFigureMetricElement from './MetricElement.vue';

const meta: Meta<typeof EditorFigureMetricElement> = {
  component: EditorFigureMetricElement,
  title: 'Template Editor/Figures/Metric/ Element',
};

export default meta;

type Story = StoryObj<typeof EditorFigureMetricElement>;

const mockData: MetricLabel = {
  format: {
    type: 'number',
  },
  text: 'total des accès',
};

const mockDataWithAggregation: MetricLabel = {
  aggregation: {
    field: 'platform',
    type: 'cardinality',
  },
  format: {
    type: 'number',
  },
  text: 'Plateformes',
};

export const Simple: Story = {
  args: {
    modelValue: mockData,
  },
  render: (args: unknown) => ({
    components: { EditorFigureMetricElement },
    setup() {
      return { args };
    },
    template: '<EditorFigureMetricElement v-bind="args" />',
  }),
};

export const WithAggregation: Story = {
  args: {
    modelValue: mockDataWithAggregation,
  },
  render: (args: unknown) => ({
    components: { EditorFigureMetricElement },
    setup() {
      return { args };
    },
    template: '<EditorFigureMetricElement v-bind="args" />',
  }),
};

export const Readonly: Story = {
  args: {
    modelValue: mockData,
    readonly: true,
  },
  render: (args: unknown) => ({
    components: { EditorFigureMetricElement },
    setup() {
      return { args };
    },
    template: '<EditorFigureMetricElement v-bind="args" />',
  }),
};
