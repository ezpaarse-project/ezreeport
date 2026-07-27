import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { TableColumn } from '~sdk/helpers/figures';

import EditorFigureTableColumn from './TableColumn.vue';

const meta: Meta<typeof EditorFigureTableColumn> = {
  component: EditorFigureTableColumn,
  title: 'Template Editor/Figures/Table/ Column',
};

export default meta;

type Story = StoryObj<typeof EditorFigureTableColumn>;

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

export const Basic: Story = {
  args: {
    modelValue: mockColumnData,
  },
  render: (args: unknown) => ({
    components: { EditorFigureTableColumn },
    setup() {
      return { args };
    },
    template: '<EditorFigureTableColumn v-bind="args" />',
  }),
};

export const Metric: Story = {
  args: {
    modelValue: mockMetricData,
  },
  render: (args: unknown) => ({
    components: { EditorFigureTableColumn },
    setup() {
      return { args };
    },
    template: '<EditorFigureTableColumn v-bind="args" />',
  }),
};
