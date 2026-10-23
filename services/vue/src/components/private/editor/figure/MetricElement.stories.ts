import type { Meta } from '@storybook/vue3-vite';
import type { MetricLabel } from '~sdk/helpers/figures';

import { useStory } from '~/__mocks__/utils';

import EditorFigureMetricElement from './MetricElement.vue';

const meta: Meta<typeof EditorFigureMetricElement> = {
  component: EditorFigureMetricElement,
  title: 'Template Editor/Figures/Metric/ Element',
};

const { defineStory } = useStory(meta);

export default meta;

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

export const Simple = defineStory({
  modelValue: mockData,
});

export const WithAggregation = defineStory({
  modelValue: mockDataWithAggregation,
});

export const Readonly = defineStory({
  modelValue: mockData,
  readonly: true,
});
