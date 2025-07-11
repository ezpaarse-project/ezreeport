import type { Meta, StoryObj } from '@storybook/vue3-vite';

import type { MetricLabel } from '~sdk/helpers/figures';

import EditorFigureMetricElement from './MetricElement.vue';

const meta: Meta<typeof EditorFigureMetricElement> = {
  title: 'Template Editor/Figures/Metric/ Element',
  component: EditorFigureMetricElement,
};

export default meta;

type Story = StoryObj<typeof EditorFigureMetricElement>;

const mockData: MetricLabel = {
  text: 'total des accès',
  format: {
    type: 'number',
  },
};

const mockDataWithAggregation: MetricLabel = {
  text: 'Plateformes',
  format: {
    type: 'number',
  },
  aggregation: {
    type: 'cardinality',
    field: 'platform',
  },
};

export const Simple: Story = {
  render: (args) => ({
    components: { EditorFigureMetricElement },
    setup() {
      return { args };
    },
    template: '<EditorFigureMetricElement v-bind="args" />',
  }),
  args: {
    modelValue: mockData,
  },
};

export const WithAggregation: Story = {
  render: (args) => ({
    components: { EditorFigureMetricElement },
    setup() {
      return { args };
    },
    template: '<EditorFigureMetricElement v-bind="args" />',
  }),
  args: {
    modelValue: mockDataWithAggregation,
  },
};

export const Readonly: Story = {
  render: (args) => ({
    components: { EditorFigureMetricElement },
    setup() {
      return { args };
    },
    template: '<EditorFigureMetricElement v-bind="args" />',
  }),
  args: {
    modelValue: mockData,
    readonly: true,
  },
};
