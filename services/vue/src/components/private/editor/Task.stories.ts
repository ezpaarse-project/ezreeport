import type { Meta } from '@storybook/vue3-vite';
import { createTaskHelper, createTaskHelperFrom } from '~sdk/helpers/tasks';
import {
  createTemplateHelper,
  createTemplateHelperFrom,
} from '~sdk/helpers/templates';

import { useStory } from '~/__mocks__/utils';

import EditorTask from './Task.vue';

const meta: Meta<typeof EditorTask> = {
  component: EditorTask,
  title: 'Template Editor/Task',
};

const { defineStory } = useStory(meta);

export default meta;

export const New = defineStory({
  extends: createTemplateHelper().body,
  modelValue: createTaskHelper().template,
});

export const Existing = defineStory({
  extends: createTemplateHelperFrom({
    body: {
      dateField: 'datetime',
      filters: [],
      index: '.ezmesure-metrics',
      layouts: [
        {
          figures: [
            {
              filters: [],
              params: {
                labels: [
                  {
                    format: {
                      type: 'number',
                    },
                    text: 'Actions',
                  },
                  {
                    aggregation: {
                      field: 'response.body.inserted',
                      type: 'sum',
                    },
                    format: {
                      type: 'number',
                    },
                    text: 'ECs insérés',
                  },
                  {
                    aggregation: {
                      field: 'response.body.updated',
                      type: 'sum',
                    },
                    format: {
                      type: 'number',
                    },
                    text: 'ECs mis à jour',
                  },
                  {
                    aggregation: {
                      field: 'response.body.failed',
                      type: 'sum',
                    },
                    format: {
                      type: 'number',
                    },
                    text: "Erreurs d'insertion",
                  },
                  {
                    aggregation: {
                      field: 'user.name',
                      type: 'cardinality',
                    },
                    format: {
                      type: 'number',
                    },
                    text: "Nombre d'utilisateurs",
                  },
                ],
              },
              slots: [0, 1],
              type: 'metric',
            },
            {
              filters: [],
              params: {
                invertAxis: true,
                label: {
                  aggregation: {
                    field: 'user.name',
                    type: 'terms',
                  },
                  title: 'Utilisateurs',
                },
                title: 'API - Top utilisateurs',
                value: {
                  aggregation: {
                    field: 'response.body.total',
                    type: 'sum',
                  },
                  title: 'Total chargé',
                },
              },
              slots: [2],
              type: 'bar',
            },
            {
              filters: [],
              params: {
                invertAxis: true,
                label: {
                  aggregation: {
                    field: 'index',
                    type: 'terms',
                  },
                },
                title: 'Top insertions index',
                value: {
                  aggregation: {
                    field: 'response.body.total',
                    type: 'sum',
                  },
                  title: 'Total chargé',
                },
              },
              slots: [3],
              type: 'bar',
            },
          ],
        },
        {
          figures: [
            {
              filters: [
                {
                  field: 'action',
                  isNot: true,
                  name: 'action is not indices/insert',
                  value: 'indices/insert',
                },
              ],
              params: {
                label: {
                  aggregation: {
                    field: '{{ dateField }}',
                    type: 'date_histogram',
                  },
                  title: 'Date',
                },
                title: 'Temps de réponse (hors insertions)',
                value: {
                  aggregation: {
                    field: 'responseTime',
                    type: 'max',
                  },
                  title: 'Temps de réponse (ms)',
                },
              },
              slots: [2, 3],
              type: 'bar',
            },
            {
              filters: [],
              params: {
                color: {
                  aggregation: {
                    field: 'action',
                    type: 'terms',
                  },
                  title: 'Actions',
                },
                label: {
                  aggregation: {
                    field: '{{ dateField }}',
                    type: 'date_histogram',
                  },
                  title: '',
                },
                title: 'Actions',
                value: {
                  title: "Nombre d'actions",
                },
              },
              slots: [0, 1],
              type: 'bar',
            },
          ],
        },
        {
          figures: [
            {
              filters: [],
              params: {
                dataLabel: {
                  format: 'numeric',
                  showLabel: true,
                },
                label: {
                  aggregation: {
                    field: 'response.status',
                    type: 'terms',
                  },
                  legend: {},
                  title: 'Statuts',
                },
                title: 'Status HTTP',
                value: {},
              },
              slots: [0, 2],
              type: 'arc',
            },
            {
              filters: [],
              params: {
                columns: [
                  {
                    aggregation: {
                      field: 'response.body.error',
                      type: 'terms',
                    },
                    header: 'Erreur',
                    metric: false,
                  },
                  {
                    aggregation: {
                      field: 'user.name',
                      missing: '-',
                      size: 1,
                      type: 'terms',
                    },
                    header: 'Utilisateur',
                    metric: false,
                  },
                  {
                    header: 'Value',
                    metric: true,
                  },
                ],
                title: 'Erreurs',
                total: false,
              },
              slots: [1, 3],
              type: 'table',
            },
          ],
        },
      ],
      version: 2,
    },
    createdAt: new Date('2025-03-05T12:36:18.743Z'),
    hidden: true,
    id: 'a538ba09-5c2d-479a-b6f9-0dff77863002',
    locale: 'fr',
    name: 'Métriques API',
    tags: [
      {
        color: '#D3339A',
        id: '0',
        name: 'Administration',
      },
    ],
    updatedAt: new Date('2025-03-05T12:36:18.743Z'),
  }).body,
  modelValue: createTaskHelperFrom({
    createdAt: new Date('2024-06-26T14:49:50.401Z'),
    description: '',
    enabled: true,
    extendedId: 'a538ba09-5c2d-479a-b6f9-0dff77863002',
    extends: {
      tags: [{ color: '#D3339A', id: '0', name: 'Administration' }],
    },
    id: 'dc1481b1-ff90-4374-a5a9-e3ef4d7cc0fb',
    lastRun: new Date('2024-12-03T06:00:00.240Z'),
    name: 'Métriques API',
    namespaceId: 'clxvxybz801d84qdpy1ekrjwn',
    nextRun: new Date('2024-12-04T06:00:00.240Z'),
    recurrence: 'DAILY',
    recurrenceOffset: {},
    targets: ['ezteam@couperin.org'],
    template: {
      dateField: 'datetime',
      filters: [],
      index: '.ezmesure-metrics',
      inserts: [
        {
          at: 1,
          figures: [
            {
              filters: [
                {
                  field: '_index',
                  isNot: false,
                  name: '_index is panist*',
                  value: 'panist*',
                },
              ],
              params: {
                dataLabel: { format: 'numeric', showLabel: false },
                invertAxis: false,
                label: {
                  aggregation: {
                    field: '{{ dateField }}',
                    type: 'date_histogram',
                  },
                  title: 'datetime',
                },
                title: 'panist : histo jour requêtes',
                value: { title: 'Count' },
              },
              slots: [2, 3],
              type: 'bar',
            },
          ],
        },
      ],
      version: 2,
    },
    updatedAt: new Date('2024-12-03T06:00:02.901Z'),
  }).template,
});
