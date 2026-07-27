import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { createVegaFigureHelper } from '~sdk/helpers/figures';

import EditorFigureVega from './Vega.vue';

const meta: Meta<typeof EditorFigureVega> = {
  component: EditorFigureVega,
  title: 'Template Editor/Figures/Vega',
};

export default meta;

const mockArc = createVegaFigureHelper(
  'arc',
  'répartition par mime',
  {
    aggregation: {
      field: 'mime',
      type: 'terms',
    },
    legend: null,
  },
  undefined,
  undefined,
  {
    format: 'percent',
    showLabel: true,
  },
  undefined,
  [
    {
      field: 'rtype',
      isNot: false,
      name: 'rtype is ARTICLE',
      value: 'ARTICLE',
    },
    {
      field: 'mime',
      isNot: true,
      name: 'mime is not DOC, etc.',
      value: ['DOC', 'MISC'],
    },
    {
      field: 'mime',
      isNot: true,
      name: 'mime exists',
    },
  ]
);

const mockBar = createVegaFigureHelper(
  'bar',
  'ip/fede établissements',
  {
    aggregation: {
      field: 'auth',
      type: 'terms',
    },
  },
  {},
  {
    aggregation: {
      field: 'owner',
      type: 'terms',
    },
    title: 'établissements',
  }
);

type Story = StoryObj<typeof EditorFigureVega>;

export const New: Story = {
  args: {
    modelValue: createVegaFigureHelper('line'),
  },
  render: (args: unknown) => ({
    components: { EditorFigureVega },
    setup() {
      return { args };
    },
    template: '<EditorFigureVega v-bind="args" />',
  }),
};

export const ArcExisting: Story = {
  args: {
    modelValue: mockArc,
  },
  render: (args: unknown) => ({
    components: { EditorFigureVega },
    setup() {
      return { args };
    },
    template: '<EditorFigureVega v-bind="args" />',
  }),
};

export const BarExisting: Story = {
  args: {
    modelValue: mockBar,
  },
  render: (args: unknown) => ({
    components: { EditorFigureVega },
    setup() {
      return { args };
    },
    template: '<EditorFigureVega v-bind="args" />',
  }),
};

export const ArcReadonly: Story = {
  args: {
    modelValue: mockArc,
    readonly: true,
  },
  render: (args: unknown) => ({
    components: { EditorFigureVega },
    setup() {
      return { args };
    },
    template: '<EditorFigureVega v-bind="args" />',
  }),
};

export const BarReadonly: Story = {
  args: {
    modelValue: mockBar,
    readonly: true,
  },
  render: (args: unknown) => ({
    components: { EditorFigureVega },
    setup() {
      return { args };
    },
    template: '<EditorFigureVega v-bind="args" />',
  }),
};
