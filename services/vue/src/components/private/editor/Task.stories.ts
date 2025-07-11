import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { createTaskHelper, createTaskHelperFrom } from '~sdk/helpers/tasks';

import { createTemplateHelper, createTemplateHelperFrom } from '~sdk/helpers/templates';
import EditorTask from './Task.vue';

const meta: Meta<typeof EditorTask> = {
  title: 'Template Editor/Task',
  component: EditorTask,
};

export default meta;

type Story = StoryObj<typeof EditorTask>;

export const New: Story = {
  render: (args) => ({
    components: { EditorTask },
    setup() {
      return { args };
    },
    template: '<EditorTask v-bind="args" />',
  }),
  args: {
    modelValue: createTaskHelper().template,
    extends: createTemplateHelper().body,
  },
};

export const Existing: Story = {
  render: (args) => ({
    components: { EditorTask },
    setup() {
      return { args };
    },
    template: '<EditorTask v-bind="args" />',
  }),
  args: {
    modelValue: createTaskHelperFrom({
      id: 'dc1481b1-ff90-4374-a5a9-e3ef4d7cc0fb',
      name: 'Métriques API',
      description: '',
      template: {
        version: 2,
        index: '.ezmesure-metrics',
        dateField: 'datetime',
        filters: [],
        inserts: [
          {
            figures: [
              {
                type: 'bar',
                slots: [2, 3],
                params: {
                  label: { title: 'datetime', aggregation: { type: 'date_histogram', field: '{{ dateField }}' } }, title: 'panist : histo jour requêtes', value: { title: 'Count' }, dataLabel: { format: 'numeric', showLabel: false }, invertAxis: false,
                },
                filters: [
                  {
                    name: '_index is panist*', field: '_index', isNot: false, value: 'panist*',
                  },
                ],
              },
            ],
            at: 1,
          },
        ],
      },
      targets: ['ezteam@couperin.org'],
      recurrence: 'DAILY',
      nextRun: new Date('2024-12-04T06:00:00.240Z'),
      lastRun: new Date('2024-12-03T06:00:00.240Z'),
      enabled: true,
      createdAt: new Date('2024-06-26T14:49:50.401Z'),
      updatedAt: new Date('2024-12-03T06:00:02.901Z'),
      extends: {
        tags: [{ name: 'Administration', color: '#D3339A' }],
      },
      extendedId: 'a538ba09-5c2d-479a-b6f9-0dff77863002',
      namespaceId: 'clxvxybz801d84qdpy1ekrjwn',
    }).template,
    extends: createTemplateHelperFrom({
      id: 'a538ba09-5c2d-479a-b6f9-0dff77863002',
      name: 'Métriques API',
      body: {
        version: 2,
        index: '.ezmesure-metrics',
        dateField: 'datetime',
        filters: [],
        layouts: [
          {
            figures: [
              {
                type: 'metric',
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
                filters: [],
                slots: [
                  0,
                  1,
                ],
              },
              {
                type: 'bar',
                params: {
                  label: {
                    title: 'Utilisateurs',
                    aggregation: {
                      type: 'terms',
                      field: 'user.name',
                    },
                  },
                  title: 'API - Top utilisateurs',
                  value: {
                    title: 'Total chargé',
                    aggregation: {
                      type: 'sum',
                      field: 'response.body.total',
                    },
                  },
                  invertAxis: true,
                },
                filters: [],
                slots: [
                  2,
                ],
              },
              {
                type: 'bar',
                params: {
                  label: {
                    aggregation: {
                      type: 'terms',
                      field: 'index',
                    },
                  },
                  title: 'Top insertions index',
                  value: {
                    title: 'Total chargé',
                    aggregation: {
                      type: 'sum',
                      field: 'response.body.total',
                    },
                  },
                  invertAxis: true,
                },
                filters: [],
                slots: [
                  3,
                ],
              },
            ],
          },
          {
            figures: [
              {
                type: 'bar',
                params: {
                  label: {
                    title: 'Date',
                    aggregation: {
                      type: 'date_histogram',
                      field: '{{ dateField }}',
                    },
                  },
                  title: 'Temps de réponse (hors insertions)',
                  value: {
                    title: 'Temps de réponse (ms)',
                    aggregation: {
                      type: 'max',
                      field: 'responseTime',
                    },
                  },
                },
                filters: [
                  {
                    name: 'action is not indices/insert',
                    isNot: true,
                    field: 'action',
                    value: 'indices/insert',
                  },
                ],
                slots: [
                  2,
                  3,
                ],
              },
              {
                type: 'bar',
                params: {
                  color: {
                    title: 'Actions',
                    aggregation: {
                      type: 'terms',
                      field: 'action',
                    },
                  },
                  label: {
                    title: '',
                    aggregation: {
                      type: 'date_histogram',
                      field: '{{ dateField }}',
                    },
                  },
                  title: 'Actions',
                  value: {
                    title: "Nombre d'actions",
                  },
                },
                filters: [],
                slots: [
                  0,
                  1,
                ],
              },
            ],
          },
          {
            figures: [
              {
                type: 'arc',
                params: {
                  label: {
                    title: 'Statuts',
                    legend: {},
                    aggregation: {
                      type: 'terms',
                      field: 'response.status',
                    },
                  },
                  title: 'Status HTTP',
                  value: {},
                  dataLabel: {
                    format: 'numeric',
                    showLabel: true,
                  },
                },
                filters: [],
                slots: [
                  0,
                  2,
                ],
              },
              {
                type: 'table',
                params: {
                  title: 'Erreurs',
                  total: false,
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
                },
                filters: [],
                slots: [
                  1,
                  3,
                ],
              },
            ],
          },
        ],
      },
      tags: [
        {
          name: 'Administration',
          color: '#D3339A',
        },
      ],
      hidden: true,
      createdAt: new Date('2025-03-05T12:36:18.743Z'),
      updatedAt: new Date('2025-03-05T12:36:18.743Z'),
    }).body,
  },
};
