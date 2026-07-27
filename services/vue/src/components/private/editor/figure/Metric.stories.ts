import type { Meta } from '@storybook/vue3-vite';
import { createMetricFigureHelper } from '~sdk/helpers/figures';

import { useStory } from '~/__mocks__/utils';

import { mockData, mockFilters } from './Metric.example';
import EditorFigureMetric from './Metric.vue';

const meta: Meta<typeof EditorFigureMetric> = {
  component: EditorFigureMetric,
  title: 'Template Editor/Figures/Metric',
};

const { defineStory } = useStory(meta);

export default meta;

export const New = defineStory({
  modelValue: createMetricFigureHelper(),
});

export const Existing = defineStory({
  modelValue: createMetricFigureHelper(mockData, mockFilters),
});

export const Readonly = defineStory({
  modelValue: createMetricFigureHelper(mockData, mockFilters),
  readonly: true,
});
