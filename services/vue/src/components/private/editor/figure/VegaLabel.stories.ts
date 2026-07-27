import type { Meta, StoryObj } from '@storybook/vue3-vite';

import EditorFigureVegaLabel from './VegaLabel.vue';

const meta: Meta<typeof EditorFigureVegaLabel> = {
  component: EditorFigureVegaLabel,
  title: 'Template Editor/Figures/Vega/ Label Layer',
};

export default meta;

type Story = StoryObj<typeof EditorFigureVegaLabel>;

export const New: Story = {
  args: {
    modelValue: {},
    type: 'line',
  },
  render: (args: unknown) => ({
    components: { EditorFigureVegaLabel },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaLabel v-bind="args" />',
  }),
};

export const Existing: Story = {
  args: {
    modelValue: {
      aggregation: {
        field: 'mime',
        type: 'terms',
      },
      legend: null,
    },
    type: 'arc',
  },
  render: (args: unknown) => ({
    components: { EditorFigureVegaLabel },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaLabel v-bind="args" />',
  }),
};

export const Readonly: Story = {
  args: {
    modelValue: {
      aggregation: {
        field: 'auth',
        type: 'terms',
      },
    },
    readonly: true,
    type: 'bar',
  },
  render: (args: unknown) => ({
    components: { EditorFigureVegaLabel },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaLabel v-bind="args" />',
  }),
};
