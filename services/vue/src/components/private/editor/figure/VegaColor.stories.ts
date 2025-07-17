import type { Meta, StoryObj } from '@storybook/vue3-vite';

import EditorFigureVegaColor from './VegaColor.vue';

const meta: Meta<typeof EditorFigureVegaColor> = {
  title: 'Template Editor/Figures/Vega/ Color Layer',
  component: EditorFigureVegaColor,
};

export default meta;

type Story = StoryObj<typeof EditorFigureVegaColor>;

export const New: Story = {
  render: (args) => ({
    components: { EditorFigureVegaColor },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaColor v-bind="args" />',
  }),
  args: {
    modelValue: undefined,
    type: 'line',
  },
};

export const Existing: Story = {
  render: (args) => ({
    components: { EditorFigureVegaColor },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaColor v-bind="args" />',
  }),
  args: {
    modelValue: {
      title: 'établissements',
      aggregation: {
        type: 'terms',
        field: 'owner',
      },
    },
    type: 'arc',
  },
};

export const Readonly: Story = {
  render: (args) => ({
    components: { EditorFigureVegaColor },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaColor v-bind="args" />',
  }),
  args: {
    modelValue: {
      title: 'établissements',
      aggregation: {
        type: 'terms',
        field: 'owner',
      },
    },
    type: 'bar',
    readonly: true,
  },
};
