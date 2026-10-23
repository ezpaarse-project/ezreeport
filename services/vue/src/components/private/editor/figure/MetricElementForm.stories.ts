import type { Meta } from '@storybook/vue3-vite';
import type { MetricLabel } from '~sdk/helpers/figures';

import { useStory } from '~/__mocks__/utils';

import EditorFigureMetricElementForm from './MetricElementForm.vue';

const meta: Meta<typeof EditorFigureMetricElementForm> = {
  component: EditorFigureMetricElementForm,
  title: 'Template Editor/Figures/Metric/ Element Form',
};

const { defineStory } = useStory(meta);

export default meta;

const mockData: MetricLabel = {
  format: {
    type: 'number',
  },
  text: 'total des accès',
};

export const New = defineStory({});

export const Existing = defineStory({
  modelValue: mockData,
});
