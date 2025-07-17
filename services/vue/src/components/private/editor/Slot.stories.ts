import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { createFigureHelperFrom } from '~sdk/helpers/figures';

import EditorSlot from './Slot.vue';

const meta: Meta<typeof EditorSlot> = {
  title: 'Template Editor/Slot',
  component: EditorSlot,
};

export default meta;

type Story = StoryObj<typeof EditorSlot>;

export const Empty: Story = {
  render: (args) => ({
    components: { EditorSlot },
    setup() {
      return { args };
    },
    template: '<EditorSlot v-bind="args" />',
  }),
  args: {
    modelValue: undefined,
  },
};

export const Markdown: Story = {
  render: (args) => ({
    components: { EditorSlot },
    setup() {
      return { args };
    },
    template: '<EditorSlot v-bind="args" />',
  }),
  args: {
    modelValue: createFigureHelperFrom({
      data: "![ezMESURE](https://raw.githubusercontent.com/ezpaarse-project/ezpaarse-project.github.io/master/ezmesure/static/images/logo-ezMESURE-350.png)\n\n## Tableau de bord générique ezPAARSE - ezMESURE\nIl s'agit du premier tableau de bord chargé automatiquement dans votre espace ezMESURE après un premier chargement de vos données d'usages traitées par ezPAARSE.\n\nRappel: \n  -  [Comment se connecter à ezMESURE pour la première fois ?](https://blog.readmetrics.org/2021/03/faq-comment-se-connecter-a-ezmesure-pour-la-premiere-fois/) .\n -  [Automatisez vos chargements dans ezMESURE](https://blog.readmetrics.org/2019/10/communication-automatisez-vos-chargements-dans-ezmesure/) .\n-  [Tutoriel ezPAARSE-ezMESURE - guide des bonnes pratiques](https://blog.readmetrics.org/2020/10/tutoriel-ezpaarse-ezmesure-guide-des-bonnes-pratiques/) .\n\n N'hésitez pas à consulter le blog ezPAARSE pour d'autres informations (tutos, FAQ, Supports mutualisés) (https://blog.readmetrics.org/)\n\nL'équipe ezTEAM.\n",
      type: 'md',
      slots: [0, 1, 2, 3],
      params: {},
      filters: [],
    }),
  },
};

export const Metric: Story = {
  render: (args) => ({
    components: { EditorSlot },
    setup() {
      return { args };
    },
    template: '<EditorSlot v-bind="args" />',
  }),
  args: {
    modelValue: createFigureHelperFrom({
      type: 'metric',
      slots: [0, 1, 2, 3],
      params: {
        labels: [
          {
            text: 'total des accès',
            format: {
              type: 'number',
            },
          },
          {
            text: 'Plateformes',
            format: {
              type: 'number',
            },
            aggregation: {
              type: 'cardinality',
              field: 'platform',
            },
          },
          {
            text: 'Titres de publications',
            format: {
              type: 'number',
            },
            aggregation: {
              type: 'cardinality',
              field: 'publication_title',
            },
          },
          {
            text: 'Période du',
            format: {
              type: 'date',
            },
            aggregation: {
              type: 'min',
              field: 'datetime',
            },
          },
          {
            text: 'au',
            format: {
              type: 'date',
            },
            aggregation: {
              type: 'max',
              field: 'datetime',
            },
          },
        ],
      },
      filters: [],
    }),
  },
};

export const Table: Story = {
  render: (args) => ({
    components: { EditorSlot },
    setup() {
      return { args };
    },
    template: '<EditorSlot v-bind="args" />',
  }),
  args: {
    modelValue: createFigureHelperFrom({
      type: 'table',
      slots: [1, 3],
      params: {
        title:
          'ezpaarse : générique les{{ length }} plateformes les plus consultées',
        columns: [
          {
            header: 'plateforme',
            metric: false,
            styles: {
              halign: 'left',
              valign: 'top',
            },
            aggregation: {
              type: 'terms',
              field: 'platform_name',
            },
          },
          {
            header: 'Value',
            metric: true,
            styles: {
              halign: 'right',
              valign: 'top',
            },
          },
        ],
        total: false,
      },
      filters: [],
    }),
  },
};

export const Vega: Story = {
  render: (args) => ({
    components: { EditorSlot },
    setup() {
      return { args };
    },
    template: '<EditorSlot v-bind="args" />',
  }),
  args: {
    modelValue: createFigureHelperFrom({
      type: 'bar',
      slots: [0, 1, 2, 3],
      params: {
        label: {
          aggregation: {
            type: 'date_histogram',
            field: 'datetime',
          },
        },
        title: 'ezpaarse : générique histogramme',
        value: {
          title: 'Count',
        },
      },
      filters: [],
    }),
  },
};

export const Readonly: Story = {
  render: (args) => ({
    components: { EditorSlot },
    setup() {
      return { args };
    },
    template: '<EditorSlot v-bind="args" />',
  }),
  args: {
    modelValue: createFigureHelperFrom({
      type: 'arc',
      slots: [0, 2],
      params: {
        label: {
          title: 'plateformes',
          legend: null,
          aggregation: {
            type: 'terms',
            field: 'platform_name',
          },
        },
        title:
          'ezpaarse : générique les {{ length }} premières plateformes éditeur',
        value: {},
        dataLabel: {
          format: 'percent',
          showLabel: true,
        },
      },
      filters: [],
    }),
    readonly: true,
  },
};
