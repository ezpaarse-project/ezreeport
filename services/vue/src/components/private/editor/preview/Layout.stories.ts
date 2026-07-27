import type { Meta } from '@storybook/vue3-vite';
import {
  createMetricFigureHelper,
  createTableFigureHelper,
  createVegaFigureHelper,
} from '~sdk/helpers/figures';
import {
  createLayoutHelper,
  createTaskLayoutHelper,
} from '~sdk/helpers/layouts';

import { useStory } from '~/__mocks__/utils';

import EditorPreviewLayout from './Layout.vue';

const meta: Meta<typeof EditorPreviewLayout> = {
  component: EditorPreviewLayout,
  title: 'Template Editor/Preview/Layout',
};

const { defineStory } = useStory(meta);

export default meta;

export const Empty = defineStory({
  modelValue: createLayoutHelper([]),
});

export const Full = defineStory({
  modelValue: createLayoutHelper([
    createVegaFigureHelper(
      'arc',
      'Type de Rapport',
      {
        aggregation: {
          field: 'Report_Header.Report_ID',
          type: 'terms',
        },
        legend: null,
      },
      {
        aggregation: {
          field: 'Count',
          type: 'sum',
        },
      },
      undefined,
      {
        format: 'percent',
        showLabel: true,
      },
      undefined,
      undefined,
      undefined,
      [0]
    ),
    createVegaFigureHelper(
      'arc',
      'Type de métrique',
      {
        aggregation: {
          field: 'Metric_Type',
          type: 'terms',
        },
        legend: null,
      },
      {
        aggregation: {
          field: 'Count',
          type: 'sum',
        },
      },
      undefined,
      {
        format: 'percent',
        showLabel: true,
      },
      undefined,
      undefined,
      undefined,
      [1]
    ),
    createMetricFigureHelper(
      [
        {
          aggregation: {
            field: 'Count',
            type: 'sum',
          },
          format: {
            type: 'number',
          },
          text: 'éléments de rapport',
        },
        {
          aggregation: {
            field: 'Platform',
            type: 'cardinality',
          },
          format: {
            type: 'number',
          },
          text: 'Platformes',
        },
        {
          aggregation: {
            field: 'X_Package',
            type: 'cardinality',
          },
          format: {
            type: 'number',
          },
          text: 'profils/comptes/fonds/antennes',
        },
        {
          aggregation: {
            field: 'X_Date_Month',
            type: 'min',
          },
          format: {
            type: 'date',
          },
          text: 'Période de',
        },
        {
          aggregation: {
            field: 'X_Date_Month',
            type: 'max',
          },
          format: {
            type: 'date',
          },
          text: 'à',
        },
      ],
      undefined,
      undefined,
      [2, 3]
    ),
  ]),
});

export const Task = defineStory({
  modelValue: createTaskLayoutHelper(
    [
      createTableFigureHelper(
        'publisher : profils-table',
        [
          {
            aggregation: {
              field: 'X_Package',
              type: 'terms',
            },
            header: 'Profil/compte:Fonds/Antenne',
            metric: false,
          },
          {
            aggregation: {
              field: 'Count',
              type: 'sum',
            },
            header: 'Value',
            metric: true,
            styles: {
              halign: 'right',
              valign: 'top',
            },
          },
        ],
        false,
        undefined,
        undefined,
        [1, 3]
      ),
    ],
    5
  ),
});
