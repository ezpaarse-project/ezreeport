import type { Meta, StoryObj } from '@storybook/vue3-vite';

import type { TableColumn } from '~sdk/helpers/figures';

import EditorFigureTableColumnForm from './TableColumnForm.vue';

const meta: Meta<typeof EditorFigureTableColumnForm> = {
  title: 'Template Editor/Figures/Table/ Column Form',
  component: EditorFigureTableColumnForm,
};

export default meta;

type Story = StoryObj<typeof EditorFigureTableColumnForm>;

const mockColumnData: TableColumn = {
  header: 'Nom',
  metric: false,
  aggregation: {
    type: 'terms',
    field: 'cnrsData.intituleUnite',
    size: 1,
  },
};

const mockMetricData: TableColumn = {
  header: 'nombre de consultations',
  metric: true,
  styles: {
    halign: 'right',
    valign: 'top',
  },
};

export const New: Story = {
  render: (args) => ({
    components: { EditorFigureTableColumnForm },
    setup() {
      return { args };
    },
    template: '<EditorFigureTableColumnForm v-bind="args" />',
  }),
  args: {},
};

export const Basic: Story = {
  render: (args) => ({
    components: { EditorFigureTableColumnForm },
    setup() {
      return { args };
    },
    template: '<EditorFigureTableColumnForm v-bind="args" />',
  }),
  args: {
    modelValue: mockColumnData,
  },
};

export const Metric: Story = {
  render: (args) => ({
    components: { EditorFigureTableColumnForm },
    setup() {
      return { args };
    },
    template: '<EditorFigureTableColumnForm v-bind="args" />',
  }),
  args: {
    modelValue: mockMetricData,
  },
};
