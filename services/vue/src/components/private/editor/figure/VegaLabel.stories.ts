import type { Meta, StoryObj } from '@storybook/vue3-vite';

import EditorFigureVegaLabel from './VegaLabel.vue';

const meta: Meta<typeof EditorFigureVegaLabel> = {
  title: 'Template Editor/Figures/Vega/ Label Layer',
  component: EditorFigureVegaLabel,
};

export default meta;

type Story = StoryObj<typeof EditorFigureVegaLabel>;

export const New: Story = {
  render: (args) => ({
    components: { EditorFigureVegaLabel },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaLabel v-bind="args" />',
  }),
  args: {
    modelValue: {},
    type: 'line',
  },
};

export const Existing: Story = {
  render: (args) => ({
    components: { EditorFigureVegaLabel },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaLabel v-bind="args" />',
  }),
  args: {
    modelValue: {
      legend: null,
      aggregation: {
        type: 'terms',
        field: 'mime',
      },
    },
    type: 'arc',
  },
};

export const Readonly: Story = {
  render: (args) => ({
    components: { EditorFigureVegaLabel },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaLabel v-bind="args" />',
  }),
  args: {
    modelValue: {
      aggregation: {
        type: 'terms',
        field: 'auth',
      },
    },
    type: 'bar',
    readonly: true,
  },
};
