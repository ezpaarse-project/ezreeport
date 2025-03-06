import type { Meta, StoryObj } from '@storybook/vue3';

import { createVegaFigureHelper } from '~sdk/helpers/figures';

import EditorPreviewSlot from './Slot.vue';

const meta: Meta<typeof EditorPreviewSlot> = {
  title: 'Template Editor/Preview/Slot',
  component: EditorPreviewSlot,
};

export default meta;

type Story = StoryObj<typeof EditorPreviewSlot>;

export const Default: Story = {
  render: (args) => ({
    components: { EditorPreviewSlot },
    setup() {
      return { args };
    },
    template: '<EditorPreviewSlot v-bind="args" />',
  }),
  args: {
    modelValue: createVegaFigureHelper(
      'arc',
      'Type de Rapport',
      {
        legend: null,
        aggregation: {
          type: 'terms',
          field: 'Report_Header.Report_ID',
        },
      },
      {
        aggregation: {
          type: 'sum',
          field: 'Count',
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
      [0],
    ),
  },
};
