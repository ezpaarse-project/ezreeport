import type { Meta, StoryObj } from '@storybook/vue3-vite';

import type { TableColumn } from '~sdk/helpers/figures';

import EditorFigureTableColumn from './TableColumn.vue';

const meta: Meta<typeof EditorFigureTableColumn> = {
  title: 'Template Editor/Figures/Table/ Column',
  component: EditorFigureTableColumn,
};

export default meta;

type Story = StoryObj<typeof EditorFigureTableColumn>;

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

export const Basic: Story = {
  render: (args) => ({
    components: { EditorFigureTableColumn },
    setup() {
      return { args };
    },
    template: '<EditorFigureTableColumn v-bind="args" />',
  }),
  args: {
    modelValue: mockColumnData,
  },
};

export const Metric: Story = {
  render: (args) => ({
    components: { EditorFigureTableColumn },
    setup() {
      return { args };
    },
    template: '<EditorFigureTableColumn v-bind="args" />',
  }),
  args: {
    modelValue: mockMetricData,
  },
};
