import type { Meta } from '@storybook/vue3-vite';
import type { TableColumn } from '~sdk/helpers/figures';

import { useStory } from '~/__mocks__/utils';

import EditorFigureTableColumnForm from './TableColumnForm.vue';

const meta: Meta<typeof EditorFigureTableColumnForm> = {
  component: EditorFigureTableColumnForm,
  title: 'Template Editor/Figures/Table/ Column Form',
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

export const New = defineStory({});

export const Basic = defineStory({
  modelValue: mockColumnData,
});

export const Metric = defineStory({
  modelValue: mockMetricData,
});
