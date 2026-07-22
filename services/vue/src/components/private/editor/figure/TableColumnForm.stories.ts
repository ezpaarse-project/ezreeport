import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { TableColumn } from '~sdk/helpers/figures';

import EditorFigureTableColumnForm from './TableColumnForm.vue';

const meta: Meta<typeof EditorFigureTableColumnForm> = {
  component: EditorFigureTableColumnForm,
  title: 'Template Editor/Figures/Table/ Column Form',
};

export default meta;

type Story = StoryObj<typeof EditorFigureTableColumnForm>;

const mockColumnData: TableColumn = {
  aggregation: {
    field: 'cnrsData.intituleUnite',
    size: 1,
    type: 'terms',
  },
  header: 'Nom',
  metric: false,
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
  args: {},
  render: (args: unknown) => ({
    components: { EditorFigureTableColumnForm },
    setup() {
      return { args };
    },
    template: '<EditorFigureTableColumnForm v-bind="args" />',
  }),
};

export const Basic: Story = {
  args: {
    modelValue: mockColumnData,
  },
  render: (args: unknown) => ({
    components: { EditorFigureTableColumnForm },
    setup() {
      return { args };
    },
    template: '<EditorFigureTableColumnForm v-bind="args" />',
  }),
};

export const Metric: Story = {
  args: {
    modelValue: mockMetricData,
  },
  render: (args: unknown) => ({
    components: { EditorFigureTableColumnForm },
    setup() {
      return { args };
    },
    template: '<EditorFigureTableColumnForm v-bind="args" />',
  }),
};
