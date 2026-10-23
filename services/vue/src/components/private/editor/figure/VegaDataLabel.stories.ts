import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import EditorFigureVegaDataLabel from './VegaDataLabel.vue';

const meta: Meta<typeof EditorFigureVegaDataLabel> = {
  component: EditorFigureVegaDataLabel,
  title: 'Template Editor/Figures/Vega/Data Label',
};

const { defineStory } = useStory(meta);

export default meta;

export const New = defineStory({
  modelValue: undefined,
  type: 'line',
});

export const Existing = defineStory({
  modelValue: {
    format: 'percent',
    showLabel: true,
  },
  type: 'arc',
});

export const Readonly = defineStory({
  modelValue: {
    format: 'percent',
    showLabel: true,
  },
  readonly: true,
  type: 'bar',
});
