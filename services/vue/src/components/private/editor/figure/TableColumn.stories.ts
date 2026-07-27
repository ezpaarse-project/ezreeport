import type { Meta } from '@storybook/vue3-vite';
import type { TableColumn } from '~sdk/helpers/figures';

import { useStory } from '~/__mocks__/utils';

import EditorFigureTableColumn from './TableColumn.vue';

const meta: Meta<typeof EditorFigureTableColumn> = {
  component: EditorFigureTableColumn,
  title: 'Template Editor/Figures/Table/ Column',
};

const { defineStory } = useStory(meta);

export default meta;

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

export const Basic = defineStory({
  modelValue: mockColumnData,
});

export const Metric = defineStory({
  modelValue: mockMetricData,
});
