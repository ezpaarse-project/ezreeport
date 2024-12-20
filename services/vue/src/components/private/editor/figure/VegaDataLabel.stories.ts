import type { Meta, StoryObj } from '@storybook/vue3';

import EditorFigureVegaDataLabel from './VegaDataLabel.vue';

const meta: Meta<typeof EditorFigureVegaDataLabel> = {
  title: 'Template Editor/Figures/Vega/Data Label',
  component: EditorFigureVegaDataLabel,
};

export default meta;

type Story = StoryObj<typeof EditorFigureVegaDataLabel>;

export const New: Story = {
  render: (args) => ({
    components: { EditorFigureVegaDataLabel },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaDataLabel v-bind="args" />',
  }),
  args: {
    modelValue: undefined,
    type: 'line',
  },
};

export const Existing: Story = {
  render: (args) => ({
    components: { EditorFigureVegaDataLabel },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaDataLabel v-bind="args" />',
  }),
  args: {
    modelValue: {
      format: 'percent',
      showLabel: true,
    },
    type: 'arc',
  },
};

export const Readonly: Story = {
  render: (args) => ({
    components: { EditorFigureVegaDataLabel },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaDataLabel v-bind="args" />',
  }),
  args: {
    modelValue: {
      format: 'percent',
      showLabel: true,
    },
    type: 'bar',
    readonly: true,
  },
};
