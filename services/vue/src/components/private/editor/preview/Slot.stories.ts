import type { Meta } from '@storybook/vue3-vite';
import { createVegaFigureHelper } from '~sdk/helpers/figures';

import { useStory } from '~/__mocks__/utils';

import EditorPreviewSlot from './Slot.vue';

const meta: Meta<typeof EditorPreviewSlot> = {
  component: EditorPreviewSlot,
  title: 'Template Editor/Preview/Slot',
};

const { defineStory } = useStory(meta);

export default meta;

export const Default = defineStory({
  modelValue: createVegaFigureHelper(
    'arc',
    'Type de Rapport',
    {
      aggregation: {
        field: 'Report_Header.Report_ID',
        type: 'terms',
      },
      legend: null,
    },
    {
      aggregation: {
        field: 'Count',
        type: 'sum',
      },
    },
    undefined,
    {
      format: 'percent',
      showLabel: true,
    },
    undefined,
    undefined,
    undefined,
    [0]
  ),
});
