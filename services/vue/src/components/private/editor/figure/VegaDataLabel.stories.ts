import type { Meta, StoryObj } from '@storybook/vue3-vite';

import EditorFigureVegaDataLabel from './VegaDataLabel.vue';

const meta: Meta<typeof EditorFigureVegaDataLabel> = {
  component: EditorFigureVegaDataLabel,
  title: 'Template Editor/Figures/Vega/Data Label',
};

export default meta;

type Story = StoryObj<typeof EditorFigureVegaDataLabel>;

export const New: Story = {
  args: {
    modelValue: undefined,
    type: 'line',
  },
  render: (args: unknown) => ({
    components: { EditorFigureVegaDataLabel },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaDataLabel v-bind="args" />',
  }),
};

export const Existing: Story = {
  args: {
    modelValue: {
      format: 'percent',
      showLabel: true,
    },
    type: 'arc',
  },
  render: (args: unknown) => ({
    components: { EditorFigureVegaDataLabel },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaDataLabel v-bind="args" />',
  }),
};

export const Readonly: Story = {
  args: {
    modelValue: {
      format: 'percent',
      showLabel: true,
    },
    readonly: true,
    type: 'bar',
  },
  render: (args: unknown) => ({
    components: { EditorFigureVegaDataLabel },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaDataLabel v-bind="args" />',
  }),
};
