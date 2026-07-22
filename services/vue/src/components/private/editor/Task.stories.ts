import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { createTaskHelper, createTaskHelperFrom } from '~sdk/helpers/tasks';
import {
  createTemplateHelper,
  createTemplateHelperFrom,
} from '~sdk/helpers/templates';

import EditorTask from './Task.vue';

const meta: Meta<typeof EditorTask> = {
  component: EditorTask,
  title: 'Template Editor/Task',
};

export default meta;

type Story = StoryObj<typeof EditorTask>;

export const New: Story = {
  args: {
    extends: createTemplateHelper().body,
    modelValue: createTaskHelper().template,
  },
  render: (args: unknown) => ({
    components: { EditorTask },
    setup() {
      return { args };
    },
    template: '<EditorTask v-bind="args" />',
  }),
};

export const Existing: Story = {
  args: {
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
                      text: 'Actions',
                      format: {
                        type: 'number',
                      },
                    },
                    {
                      text: 'ECs insérés',
                      format: {
                        type: 'number',
                      },
                      aggregation: {
                        type: 'sum',
                        field: 'response.body.inserted',
                      },
                    },
                    {
                      text: 'ECs mis à jour',
                      format: {
                        type: 'number',
                      },
                      aggregation: {
                        type: 'sum',
                        field: 'response.body.updated',
                      },
                    },
                    {
                      text: "Erreurs d'insertion",
                      format: {
                        type: 'number',
                      },
                      aggregation: {
                        type: 'sum',
                        field: 'response.body.failed',
                      },
                    },
                    {
                      text: "Nombre d'utilisateurs",
                      format: {
                        type: 'number',
                      },
                      aggregation: {
                        type: 'cardinality',
                        field: 'user.name',
                      },
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
                    name: 'action is not indices/insert',
                    isNot: true,
                    field: 'action',
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
                      header: 'Erreur',
                      metric: false,
                      aggregation: {
                        type: 'terms',
                        field: 'response.body.error',
                      },
                    },
                    {
                      header: 'Utilisateur',
                      metric: false,
                      aggregation: {
                        size: 1,
                        type: 'terms',
                        field: 'user.name',
                        missing: '-',
                      },
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
                type: 'bar',
                slots: [2, 3],
                params: {
                  label: {
                    title: 'datetime',
                    aggregation: {
                      type: 'date_histogram',
                      field: '{{ dateField }}',
                    },
                  },
                  title: 'panist : histo jour requêtes',
                  value: { title: 'Count' },
                  dataLabel: { format: 'numeric', showLabel: false },
                  invertAxis: false,
                },
                filters: [
                  {
                    name: '_index is panist*',
                    field: '_index',
                    isNot: false,
                    value: 'panist*',
                  },
                ],
              },
            ],
          },
        ],
        version: 2,
      },
      updatedAt: new Date('2024-12-03T06:00:02.901Z'),
    }).template,
  },
  render: (args: unknown) => ({
    components: { EditorTask },
    setup() {
      return { args };
    },
    template: '<EditorTask v-bind="args" />',
  }),
};
