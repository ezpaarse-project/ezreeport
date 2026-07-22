import type { Meta, StoryObj } from '@storybook/vue3-vite';

import EditorFigureVegaValue from './VegaValue.vue';

const meta: Meta<typeof EditorFigureVegaValue> = {
  component: EditorFigureVegaValue,
  title: 'Template Editor/Figures/Vega/ Value Layer',
};

export default meta;

type Story = StoryObj<typeof EditorFigureVegaValue>;

export const New: Story = {
  args: {
    modelValue: {},
    type: 'line',
  },
  render: (args: unknown) => ({
    components: { EditorFigureVegaValue },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaValue v-bind="args" />',
  }),
};

export const Existing: Story = {
  args: {
    modelValue: { aggregation: { field: 'Count', type: 'sum' } },
    type: 'arc',
  },
  render: (args: unknown) => ({
    components: { EditorFigureVegaValue },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaValue v-bind="args" />',
  }),
};

export const Readonly: Story = {
  args: {
    modelValue: { aggregation: { field: 'Count', type: 'sum' } },
    readonly: true,
    type: 'bar',
  },
  render: (args: unknown) => ({
    components: { EditorFigureVegaValue },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaValue v-bind="args" />',
  }),
};
