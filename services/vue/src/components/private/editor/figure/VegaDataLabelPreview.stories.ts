import type { Meta, StoryObj } from '@storybook/vue3';

import EditorFigureVegaDataLabelPreview from './VegaDataLabelPreview.vue';

const meta: Meta<typeof EditorFigureVegaDataLabelPreview> = {
  title: 'Template Editor/Figures/Vega/ Data Label Preview',
  component: EditorFigureVegaDataLabelPreview,
};

export default meta;

type Story = StoryObj<typeof EditorFigureVegaDataLabelPreview>;

export const InFigure: Story = {
  render: (args) => ({
    components: { EditorFigureVegaDataLabelPreview },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaDataLabelPreview v-bind="args" />',
  }),
  args: {
    modelValue: {
      format: 'percent',
      showLabel: true,
    },
    type: 'arc',
  },
};

export const OutFigure: Story = {
  render: (args) => ({
    components: { EditorFigureVegaDataLabelPreview },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaDataLabelPreview v-bind="args" />',
  }),
  args: {
    modelValue: {
      position: 'out',
      format: 'numeric',
    },
    type: 'arc',
  },
};
