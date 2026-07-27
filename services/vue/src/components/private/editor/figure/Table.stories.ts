import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { TemplateFilter } from '~sdk/helpers/filters';
import {
  type TableColumn,
  createTableFigureHelper,
} from '~sdk/helpers/figures';

import EditorFigureTable from './Table.vue';

const meta: Meta<typeof EditorFigureTable> = {
  component: EditorFigureTable,
  title: 'Template Editor/Figures/Table',
};

export default meta;

type Story = StoryObj<typeof EditorFigureTable>;

const mockFilters: TemplateFilter[] = [
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
];

const mockData: TableColumn[] = [
  {
    aggregation: {
      field: 'unit',
      type: 'terms',
    },
    header: 'Laboratoire',
    metric: false,
  },
  {
    aggregation: {
      field: 'cnrsData.sigleUnite',
      size: 1,
      type: 'terms',
    },
    header: 'Sigle',
    metric: false,
  },
  {
    aggregation: {
      field: 'cnrsData.intituleUnite',
      size: 1,
      type: 'terms',
    },
    header: 'Nom',
    metric: false,
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
  args: {
    modelValue: createTableFigureHelper(),
  },
  render: (args: unknown) => ({
    components: { EditorFigureTable },
    setup() {
      return { args };
    },
    template: '<EditorFigureTable v-bind="args" />',
  }),
};

export const Existing: Story = {
  args: {
    modelValue: createTableFigureHelper(
      undefined,
      mockData,
      undefined,
      mockFilters
    ),
  },
  render: (args: unknown) => ({
    components: { EditorFigureTable },
    setup() {
      return { args };
    },
    template: '<EditorFigureTable v-bind="args" />',
  }),
};

export const Readonly: Story = {
  args: {
    modelValue: createTableFigureHelper(
      'Table title',
      mockData,
      true,
      mockFilters
    ),
    readonly: true,
  },
  render: (args: unknown) => ({
    components: { EditorFigureTable },
    setup() {
      return { args };
    },
    template: '<EditorFigureTable v-bind="args" />',
  }),
};
