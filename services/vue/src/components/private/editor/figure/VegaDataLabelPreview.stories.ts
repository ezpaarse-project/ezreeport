import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import EditorFigureVegaDataLabelPreview from './VegaDataLabelPreview.vue';

const meta: Meta<typeof EditorFigureVegaDataLabelPreview> = {
  component: EditorFigureVegaDataLabelPreview,
  title: 'Template Editor/Figures/Vega/ Data Label Preview',
};

const { defineStory } = useStory(meta);

export default meta;

export const InFigure = defineStory({
  modelValue: {
    format: 'percent',
    showLabel: true,
  },
  type: 'arc',
});

export const OutFigure = defineStory({
  modelValue: {
    format: 'numeric',
    position: 'out',
  },
  type: 'arc',
});
