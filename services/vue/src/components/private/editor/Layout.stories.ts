import type { Meta, StoryObj } from '@storybook/vue3-vite';
import {
  createMetricFigureHelper,
  createTableFigureHelper,
  createVegaFigureHelper,
} from '~sdk/helpers/figures';
import {
  createLayoutHelper,
  createTaskLayoutHelper,
} from '~sdk/helpers/layouts';

import EditorLayout from './Layout.vue';

const meta: Meta<typeof EditorLayout> = {
  component: EditorLayout,
  title: 'Template Editor/Layout',
};

export default meta;

type Story = StoryObj<typeof EditorLayout>;

export const Empty: Story = {
  args: {
    modelValue: createLayoutHelper([]),
  },
  render: (args: unknown) => ({
    components: { EditorLayout },
    setup() {
      return { args };
    },
    template: '<EditorLayout v-bind="args" />',
  }),
};

export const Full: Story = {
  args: {
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
  },
  render: (args: unknown) => ({
    components: { EditorLayout },
    setup() {
      return { args };
    },
    template: '<EditorLayout v-bind="args" />',
  }),
};

export const Task: Story = {
  args: {
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
  },
  render: (args: unknown) => ({
    components: { EditorLayout },
    setup() {
      return { args };
    },
    template: '<EditorLayout v-bind="args" />',
  }),
};
