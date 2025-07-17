import type { Meta, StoryObj } from '@storybook/vue3-vite';

import EditorFigureVegaValue from './VegaValue.vue';

const meta: Meta<typeof EditorFigureVegaValue> = {
  title: 'Template Editor/Figures/Vega/ Value Layer',
  component: EditorFigureVegaValue,
};

export default meta;

type Story = StoryObj<typeof EditorFigureVegaValue>;

export const New: Story = {
  render: (args) => ({
    components: { EditorFigureVegaValue },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaValue v-bind="args" />',
  }),
  args: {
    modelValue: {},
    type: 'line',
  },
};

export const Existing: Story = {
  render: (args) => ({
    components: { EditorFigureVegaValue },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaValue v-bind="args" />',
  }),
  args: {
    modelValue: { aggregation: { type: 'sum', field: 'Count' } },
    type: 'arc',
  },
};

export const Readonly: Story = {
  render: (args) => ({
    components: { EditorFigureVegaValue },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaValue v-bind="args" />',
  }),
  args: {
    modelValue: { aggregation: { type: 'sum', field: 'Count' } },
    type: 'bar',
    readonly: true,
  },
};
