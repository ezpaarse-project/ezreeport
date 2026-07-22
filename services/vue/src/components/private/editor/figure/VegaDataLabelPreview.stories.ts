import type { Meta, StoryObj } from '@storybook/vue3-vite';

import EditorFigureVegaDataLabelPreview from './VegaDataLabelPreview.vue';

const meta: Meta<typeof EditorFigureVegaDataLabelPreview> = {
  component: EditorFigureVegaDataLabelPreview,
  title: 'Template Editor/Figures/Vega/ Data Label Preview',
};

export default meta;

type Story = StoryObj<typeof EditorFigureVegaDataLabelPreview>;

export const InFigure: Story = {
  args: {
    modelValue: {
      format: 'percent',
      showLabel: true,
    },
    type: 'arc',
  },
  render: (args: unknown) => ({
    components: { EditorFigureVegaDataLabelPreview },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaDataLabelPreview v-bind="args" />',
  }),
};

export const OutFigure: Story = {
  args: {
    modelValue: {
      format: 'numeric',
      position: 'out',
    },
    type: 'arc',
  },
  render: (args: unknown) => ({
    components: { EditorFigureVegaDataLabelPreview },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaDataLabelPreview v-bind="args" />',
  }),
};
