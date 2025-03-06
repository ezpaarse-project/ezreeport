import type { Meta, StoryObj } from '@storybook/vue3';

import type { TemplateFilter } from '~sdk/helpers/filters';
import { createTableFigureHelper, type TableColumn } from '~sdk/helpers/figures';

import EditorFigureTable from './Table.vue';

const meta: Meta<typeof EditorFigureTable> = {
  title: 'Template Editor/Figures/Table',
  component: EditorFigureTable,
};

export default meta;

type Story = StoryObj<typeof EditorFigureTable>;

const mockFilters: TemplateFilter[] = [
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
];

const mockData: TableColumn[] = [
  {
    header: 'Laboratoire',
    metric: false,
    aggregation: {
      type: 'terms',
      field: 'unit',
    },
  },
  {
    header: 'Sigle',
    metric: false,
    aggregation: {
      type: 'terms',
      field: 'cnrsData.sigleUnite',
      size: 1,
    },
  },
  {
    header: 'Nom',
    metric: false,
    aggregation: {
      type: 'terms',
      field: 'cnrsData.intituleUnite',
      size: 1,
    },
  },
  {
    header: 'nombre de consultations',
    metric: true,
    styles: {
      halign: 'right',
      valign: 'top',
    },
  },
];

export const New: Story = {
  render: (args) => ({
    components: { EditorFigureTable },
    setup() {
      return { args };
    },
    template: '<EditorFigureTable v-bind="args" />',
  }),
  args: {
    modelValue: createTableFigureHelper(),
  },
};

export const Existing: Story = {
  render: (args) => ({
    components: { EditorFigureTable },
    setup() {
      return { args };
    },
    template: '<EditorFigureTable v-bind="args" />',
  }),
  args: {
    modelValue: createTableFigureHelper(undefined, mockData, undefined, mockFilters),
  },
};

export const Readonly: Story = {
  render: (args) => ({
    components: { EditorFigureTable },
    setup() {
      return { args };
    },
    template: '<EditorFigureTable v-bind="args" />',
  }),
  args: {
    modelValue: createTableFigureHelper('Table title', mockData, true, mockFilters),
    readonly: true,
  },
};
