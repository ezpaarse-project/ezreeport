import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import EditorFigureVegaColor from './VegaColor.vue';

const meta: Meta<typeof EditorFigureVegaColor> = {
  component: EditorFigureVegaColor,
  title: 'Template Editor/Figures/Vega/ Color Layer',
};

const { defineStory } = useStory(meta);

export default meta;

export const New = defineStory({
  modelValue: undefined,
  type: 'line',
});

export const Existing = defineStory({
  modelValue: {
    aggregation: {
      field: 'owner',
      type: 'terms',
    },
    title: 'établissements',
  },
  type: 'arc',
});

export const Readonly = defineStory({
  modelValue: {
    aggregation: {
      field: 'owner',
      type: 'terms',
    },
    title: 'établissements',
  },
  readonly: true,
  type: 'bar',
});
