import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import EditorFigureVegaValue from './VegaValue.vue';

const meta: Meta<typeof EditorFigureVegaValue> = {
  component: EditorFigureVegaValue,
  title: 'Template Editor/Figures/Vega/ Value Layer',
};

const { defineStory } = useStory(meta);

export default meta;

export const New = defineStory({
  modelValue: {},
  type: 'line',
});

export const Existing = defineStory({
  modelValue: { aggregation: { field: 'Count', type: 'sum' } },
  type: 'arc',
});

export const Readonly = defineStory({
  modelValue: { aggregation: { field: 'Count', type: 'sum' } },
  readonly: true,
  type: 'bar',
});
