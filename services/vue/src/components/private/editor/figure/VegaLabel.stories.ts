import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import EditorFigureVegaLabel from './VegaLabel.vue';

const meta: Meta<typeof EditorFigureVegaLabel> = {
  component: EditorFigureVegaLabel,
  title: 'Template Editor/Figures/Vega/ Label Layer',
};

const { defineStory } = useStory(meta);

export default meta;

export const New = defineStory({
  modelValue: {},
  type: 'line',
});

export const Existing = defineStory({
  modelValue: {
    aggregation: {
      field: 'mime',
      type: 'terms',
    },
    legend: null,
  },
  type: 'arc',
});

export const Readonly = defineStory({
  modelValue: {
    aggregation: {
      field: 'auth',
      type: 'terms',
    },
  },
  readonly: true,
  type: 'bar',
});
