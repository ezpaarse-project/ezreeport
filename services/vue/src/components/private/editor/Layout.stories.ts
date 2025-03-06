import type { Meta, StoryObj } from '@storybook/vue3';

import { createVegaFigureHelper, createMetricFigureHelper, createTableFigureHelper } from '~sdk/helpers/figures';
import { createLayoutHelper, createTaskLayoutHelper } from '~sdk/helpers/layouts';

import EditorLayout from './Layout.vue';

const meta: Meta<typeof EditorLayout> = {
  title: 'Template Editor/Layout',
  component: EditorLayout,
};

export default meta;

type Story = StoryObj<typeof EditorLayout>;

export const Empty: Story = {
  render: (args) => ({
    components: { EditorLayout },
    setup() {
      return { args };
    },
    template: '<EditorLayout v-bind="args" />',
  }),
  args: {
    modelValue: createLayoutHelper([]),
  },
};

export const Full: Story = {
  render: (args) => ({
    components: { EditorLayout },
    setup() {
      return { args };
    },
    template: '<EditorLayout v-bind="args" />',
  }),
  args: {
    modelValue: createLayoutHelper([
      createVegaFigureHelper(
        'arc',
        'Type de Rapport',
        {
          legend: null,
          aggregation: {
            type: 'terms',
            field: 'Report_Header.Report_ID',
          },
        },
        {
          aggregation: {
            type: 'sum',
            field: 'Count',
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
        [0],
      ),
      createVegaFigureHelper(
        'arc',
        'Type de métrique',
        {
          legend: null,
          aggregation: {
            type: 'terms',
            field: 'Metric_Type',
          },
        },
        {
          aggregation: {
            type: 'sum',
            field: 'Count',
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
        [1],
      ),
      createMetricFigureHelper(
        [
          {
            text: 'éléments de rapport',
            format: {
              type: 'number',
            },
            aggregation: {
              type: 'sum',
              field: 'Count',
            },
          },
          {
            text: 'Platformes',
            format: {
              type: 'number',
            },
            aggregation: {
              type: 'cardinality',
              field: 'Platform',
            },
          },
          {
            text: 'profils/comptes/fonds/antennes',
            format: {
              type: 'number',
            },
            aggregation: {
              type: 'cardinality',
              field: 'X_Package',
            },
          },
          {
            text: 'Période de',
            format: {
              type: 'date',
            },
            aggregation: {
              type: 'min',
              field: 'X_Date_Month',
            },
          },
          {
            text: 'à',
            format: {
              type: 'date',
            },
            aggregation: {
              type: 'max',
              field: 'X_Date_Month',
            },
          },
        ],
        undefined,
        undefined,
        [2, 3],
      ),
    ]),
  },
};

export const Task: Story = {
  render: (args) => ({
    components: { EditorLayout },
    setup() {
      return { args };
    },
    template: '<EditorLayout v-bind="args" />',
  }),
  args: {
    modelValue: createTaskLayoutHelper([
      createTableFigureHelper(
        'publisher : profils-table',
        [
          {
            header: 'Profil/compte:Fonds/Antenne',
            metric: false,
            aggregation: {
              type: 'terms',
              field: 'X_Package',
            },
          },
          {
            header: 'Value',
            metric: true,
            styles: {
              halign: 'right',
              valign: 'top',
            },
            aggregation: {
              type: 'sum',
              field: 'Count',
            },
          },
        ],
        false,
        undefined,
        undefined,
        [1, 3],
      ),
    ], 5),
  },
};
