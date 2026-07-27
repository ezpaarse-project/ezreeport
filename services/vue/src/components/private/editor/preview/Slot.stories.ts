import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { createVegaFigureHelper } from '~sdk/helpers/figures';

import EditorPreviewSlot from './Slot.vue';

const meta: Meta<typeof EditorPreviewSlot> = {
  component: EditorPreviewSlot,
  title: 'Template Editor/Preview/Slot',
};

export default meta;

type Story = StoryObj<typeof EditorPreviewSlot>;

export const Default: Story = {
  args: {
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
  },
  render: (args: unknown) => ({
    components: { EditorPreviewSlot },
    setup() {
      return { args };
    },
    template: '<EditorPreviewSlot v-bind="args" />',
  }),
};
