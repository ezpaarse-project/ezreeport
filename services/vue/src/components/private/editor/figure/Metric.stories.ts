import type { Meta, StoryObj } from '@storybook/vue3-vite';

import type { TemplateFilter } from '~sdk/helpers/filters';
import { createMetricFigureHelper, type MetricLabel } from '~sdk/helpers/figures';

import EditorFigureMetric from './Metric.vue';

const meta: Meta<typeof EditorFigureMetric> = {
  title: 'Template Editor/Figures/Metric',
  component: EditorFigureMetric,
};

export default meta;

type Story = StoryObj<typeof EditorFigureMetric>;

const mockFilters: TemplateFilter[] = [
  {
    name: 'rtype is ARTICLE',
    field: 'rtype',
    isNot: false,
    value: 'ARTICLE',
  },
  {
    name: 'mime is not DOC, etc.',
    field: 'mime',
    isNot: true,
    value: [
      'DOC',
      'MISC',
    ],
  },
  {
    name: 'mime exists',
    field: 'mime',
    isNot: true,
  },
];

const mockData: MetricLabel[] = [
  {
    text: 'total des accès',
    format: {
      type: 'number',
    },
  },
  {
    text: 'Unités consultantes',
    format: {
      type: 'number',
    },
    aggregation: {
      type: 'cardinality',
      field: 'unit',
    },
  },
  {
    text: 'Plateformes',
    format: {
      type: 'number',
    },
    aggregation: {
      type: 'cardinality',
      field: 'platform',
    },
  },
  {
    text: 'Période du',
    format: {
      type: 'date',
    },
    aggregation: {
      type: 'min',
      field: 'datetime',
    },
  },
  {
    text: 'au',
    format: {
      type: 'date',
    },
    aggregation: {
      type: 'max',
      field: 'datetime',
    },
  },
];

export const New: Story = {
  render: (args) => ({
    components: { EditorFigureMetric },
    setup() {
      return { args };
    },
    template: '<EditorFigureMetric v-bind="args" />',
  }),
  args: {
    modelValue: createMetricFigureHelper(),
  },
};

export const Existing: Story = {
  render: (args) => ({
    components: { EditorFigureMetric },
    setup() {
      return { args };
    },
    template: '<EditorFigureMetric v-bind="args" />',
  }),
  args: {
    modelValue: createMetricFigureHelper(mockData, mockFilters),
  },
};

export const Readonly: Story = {
  render: (args) => ({
    components: { EditorFigureMetric },
    setup() {
      return { args };
    },
    template: '<EditorFigureMetric v-bind="args" />',
  }),
  args: {
    modelValue: createMetricFigureHelper(mockData, mockFilters),
    readonly: true,
  },
};
