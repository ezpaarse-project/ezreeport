import type { Meta, StoryObj } from '@storybook/vue3-vite';

import EditorFigureVegaColor from './VegaColor.vue';

const meta: Meta<typeof EditorFigureVegaColor> = {
  component: EditorFigureVegaColor,
  title: 'Template Editor/Figures/Vega/ Color Layer',
};

export default meta;

type Story = StoryObj<typeof EditorFigureVegaColor>;

export const New: Story = {
  args: {
    modelValue: undefined,
    type: 'line',
  },
  render: (args: unknown) => ({
    components: { EditorFigureVegaColor },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaColor v-bind="args" />',
  }),
};

export const Existing: Story = {
  args: {
    modelValue: {
      aggregation: {
        field: 'owner',
        type: 'terms',
      },
      title: 'établissements',
    },
    type: 'arc',
  },
  render: (args: unknown) => ({
    components: { EditorFigureVegaColor },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaColor v-bind="args" />',
  }),
};

export const Readonly: Story = {
  args: {
    modelValue: {
      aggregation: {
        field: 'owner',
        type: 'terms',
      },
      title: 'établissements',
    },
    readonly: true,
    type: 'bar',
  },
  render: (args: unknown) => ({
    components: { EditorFigureVegaColor },
    setup() {
      return { args };
    },
    template: '<EditorFigureVegaColor v-bind="args" />',
  }),
};
