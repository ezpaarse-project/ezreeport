import type { Meta } from '@storybook/vue3-vite';
import { createFigureHelperFrom } from '~sdk/helpers/figures';

import { useStory } from '~/__mocks__/utils';

import EditorSlot from './Slot.vue';

const meta: Meta<typeof EditorSlot> = {
  component: EditorSlot,
  title: 'Template Editor/Slot',
};

const { defineStory } = useStory(meta);

export default meta;

export const Empty = defineStory({
  modelValue: undefined,
});

export const Markdown = defineStory({
  modelValue: createFigureHelperFrom({
    data: "![ezMESURE](https://raw.githubusercontent.com/ezpaarse-project/ezpaarse-project.github.io/master/ezmesure/static/images/logo-ezMESURE-350.png)\n\n## Tableau de bord générique ezPAARSE - ezMESURE\nIl s'agit du premier tableau de bord chargé automatiquement dans votre espace ezMESURE après un premier chargement de vos données d'usages traitées par ezPAARSE.\n\nRappel: \n  -  [Comment se connecter à ezMESURE pour la première fois ?](https://blog.readmetrics.org/2021/03/faq-comment-se-connecter-a-ezmesure-pour-la-premiere-fois/) .\n -  [Automatisez vos chargements dans ezMESURE](https://blog.readmetrics.org/2019/10/communication-automatisez-vos-chargements-dans-ezmesure/) .\n-  [Tutoriel ezPAARSE-ezMESURE - guide des bonnes pratiques](https://blog.readmetrics.org/2020/10/tutoriel-ezpaarse-ezmesure-guide-des-bonnes-pratiques/) .\n\n N'hésitez pas à consulter le blog ezPAARSE pour d'autres informations (tutos, FAQ, Supports mutualisés) (https://blog.readmetrics.org/)\n\nL'équipe ezTEAM.\n",
    filters: [],
    params: {},
    slots: [0, 1, 2, 3],
    type: 'md',
  }),
});

export const Metric = defineStory({
  modelValue: createFigureHelperFrom({
    filters: [],
    params: {
      labels: [
        {
          format: {
            type: 'number',
          },
          text: 'total des accès',
        },
        {
          aggregation: {
            field: 'platform',
            type: 'cardinality',
          },
          format: {
            type: 'number',
          },
          text: 'Plateformes',
        },
        {
          aggregation: {
            field: 'publication_title',
            type: 'cardinality',
          },
          format: {
            type: 'number',
          },
          text: 'Titres de publications',
        },
        {
          aggregation: {
            field: 'datetime',
            type: 'min',
          },
          format: {
            type: 'date',
          },
          text: 'Période du',
        },
        {
          aggregation: {
            field: 'datetime',
            type: 'max',
          },
          format: {
            type: 'date',
          },
          text: 'au',
        },
      ],
    },
    slots: [0, 1, 2, 3],
    type: 'metric',
  }),
});

export const Table = defineStory({
  modelValue: createFigureHelperFrom({
    filters: [],
    params: {
      columns: [
        {
          aggregation: {
            field: 'platform_name',
            type: 'terms',
          },
          header: 'plateforme',
          metric: false,
          styles: {
            halign: 'left',
            valign: 'top',
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
      title:
        'ezpaarse : générique les{{ length }} plateformes les plus consultées',
      total: false,
    },
    slots: [1, 3],
    type: 'table',
  }),
});

export const Vega = defineStory({
  modelValue: createFigureHelperFrom({
    filters: [],
    params: {
      label: {
        aggregation: {
          field: 'datetime',
          type: 'date_histogram',
        },
      },
      title: 'ezpaarse : générique histogramme',
      value: {
        title: 'Count',
      },
    },
    slots: [0, 1, 2, 3],
    type: 'bar',
  }),
});

export const Readonly = defineStory({
  modelValue: createFigureHelperFrom({
    filters: [],
    params: {
      dataLabel: {
        format: 'percent',
        showLabel: true,
      },
      label: {
        aggregation: {
          field: 'platform_name',
          type: 'terms',
        },
        legend: null,
        title: 'plateformes',
      },
      title:
        'ezpaarse : générique les {{ length }} premières plateformes éditeur',
      value: {},
    },
    slots: [0, 2],
    type: 'arc',
  }),
  readonly: true,
});
