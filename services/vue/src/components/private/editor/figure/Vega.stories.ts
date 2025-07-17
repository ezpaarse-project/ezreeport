import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { createVegaFigureHelper } from '~sdk/helpers/figures';

import EditorFigureVega from './Vega.vue';

const meta: Meta<typeof EditorFigureVega> = {
  title: 'Template Editor/Figures/Vega',
  component: EditorFigureVega,
};

export default meta;

const mockArc = createVegaFigureHelper(
  'arc',
  'répartition par mime',
  {
    legend: null,
    aggregation: {
      type: 'terms',
      field: 'mime',
    },
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
      name: 'rtype is ARTICLE',
      field: 'rtype',
      isNot: false,
      value: 'ARTICLE',
    },
    {
      name: 'mime is not DOC, etc.',
      field: 'mime',
      isNot: true,
      value: [
        'DOC',
        'MISC',
      ],
    },
    {
      name: 'mime exists',
      field: 'mime',
      isNot: true,
    },
  ],
);

const mockBar = createVegaFigureHelper(
  'bar',
  'ip/fede établissements',
  {
    aggregation: {
      type: 'terms',
      field: 'auth',
    },
  },
  {},
  {
    title: 'établissements',
    aggregation: {
      type: 'terms',
      field: 'owner',
    },
  },
);

type Story = StoryObj<typeof EditorFigureVega>;

export const New: Story = {
  render: (args) => ({
    components: { EditorFigureVega },
    setup() {
      return { args };
    },
    template: '<EditorFigureVega v-bind="args" />',
  }),
  args: {
    modelValue: createVegaFigureHelper('line'),
  },
};

export const ArcExisting: Story = {
  render: (args) => ({
    components: { EditorFigureVega },
    setup() {
      return { args };
    },
    template: '<EditorFigureVega v-bind="args" />',
  }),
  args: {
    modelValue: mockArc,
  },
};

export const BarExisting: Story = {
  render: (args) => ({
    components: { EditorFigureVega },
    setup() {
      return { args };
    },
    template: '<EditorFigureVega v-bind="args" />',
  }),
  args: {
    modelValue: mockBar,
  },
};

export const ArcReadonly: Story = {
  render: (args) => ({
    components: { EditorFigureVega },
    setup() {
      return { args };
    },
    template: '<EditorFigureVega v-bind="args" />',
  }),
  args: {
    modelValue: mockArc,
    readonly: true,
  },
};

export const BarReadonly: Story = {
  render: (args) => ({
    components: { EditorFigureVega },
    setup() {
      return { args };
    },
    template: '<EditorFigureVega v-bind="args" />',
  }),
  args: {
    modelValue: mockBar,
    readonly: true,
  },
};
