import type { Meta, StoryObj } from '@storybook/vue3';

import GenerationJobCard from './JobCard.vue';

const meta: Meta<typeof GenerationJobCard> = {
  title: 'Queue/Generation/Job Card',
  component: GenerationJobCard,
};

export default meta;

type Story = StoryObj<typeof GenerationJobCard>;

export const Default: Story = {
  render: (args) => ({
    components: { GenerationJobCard },
    setup() {
      return { args };
    },
    template: '<GenerationJobCard v-bind="args" />',
  }),
  args: {
    modelValue: {
      id: '2',
      data: {
        task: {
          id: 'dc1481b1-ff90-4374-a5a9-e3ef4d7cc0fb',
          name: 'Métriques API',
          namespaceId: 'clxvxybz801d84qdpy1ekrjwn',
          extendedId: 'a538ba09-5c2d-479a-b6f9-0dff77863002',
          template: {
            version: 2,
            index: '.ezmesure-metrics',
            dateField: 'datetime',
            filters: [],
            inserts: [],
          },
          lastExtended: null,
          targets: [
            'ezteam@couperin.org',
          ],
          recurrence: 'DAILY',
          nextRun: new Date('2024-12-05T06:00:00.172Z'),
          lastRun: new Date('2024-12-03T09:45:02.760Z'),
          enabled: false,
          createdAt: new Date('2024-11-26T15:55:18.316Z'),
          updatedAt: new Date('2024-12-04T14:38:54.382Z'),
        },
        period: {
          start: new Date('2024-05-16T22:00:00.000Z'),
          end: new Date('2024-05-17T21:59:59.999Z'),
        },
        origin: 'ezmesure-admin',
        shouldWriteActivity: false,
      },
      result: {
        success: true,
        detail: {
          createdAt: new Date('2024-12-18T07:58:47.138Z'),
          destroyAt: new Date('2024-12-25T07:58:47.138Z'),
          took: 1328,
          taskId: 'dc1481b1-ff90-4374-a5a9-e3ef4d7cc0fb',
          files: {
            detail: '2024/2024-12/ezREEPORT_métriques-api.det.json',
            report: '2024/2024-12/ezREEPORT_métriques-api.rep.pdf',
          },
          meta: {
            jobId: '2',
            jobAdded: new Date('2024-12-18T07:58:47.134Z'),
          },
          period: {
            start: new Date('2024-05-16T22:00:00.000Z'),
            end: new Date('2024-05-17T21:59:59.999Z'),
          },
          auth: {
            elastic: {
              username: 'report.clxvxybz801d84qdpy1ekrjwn',
            },
          },
          sendingTo: [
            'ezteam@couperin.org',
          ],
          stats: {
            pageCount: 3,
            size: 237862,
          },
        },
      },
      progress: 1,
      added: new Date('2024-12-18T07:58:47.134Z'),
      started: new Date('2024-12-18T07:58:47.135Z'),
      ended: new Date('2024-12-18T07:58:48.475Z'),
      attempts: 1,
      status: 'completed',
    },
  },
};

export const Failed: Story = {
  render: (args) => ({
    components: { GenerationJobCard },
    setup() {
      return { args };
    },
    template: '<GenerationJobCard v-bind="args" />',
  }),
  args: {
    modelValue: {
      id: '1',
      data: {
        task: {
          id: '9a0f8b83-ae34-4768-8d08-1646037a9e8d',
          name: 'PR Searches_Platform annuel',
          namespaceId: '77244590-5e04-11ee-bef0-fbc8021705d4',
          extendedId: 'ec7c0504-4b6c-42b5-87a0-0bac9bb02cc3',
          template: {
            version: 2,
            index: '*-publisher*',
            dateField: 'X_Date_Month',
            filters: [],
            inserts: [],
          },
          lastExtended: null,
          targets: [
            'ezteam@couperin.org',
            'celine.paillaret@univ-montp3.fr',
            'marie.nikichine@univ-montp3.fr',
          ],
          recurrence: 'YEARLY',
          nextRun: new Date('2025-02-01T05:00:00.000Z'),
          enabled: false,
          createdAt: new Date('2024-12-04T14:15:31.112Z'),
          updatedAt: new Date('2024-12-04T14:38:54.414Z'),
        },
        period: {
          start: new Date('2022-12-31T23:00:00.000Z'),
          end: new Date('2023-12-31T22:59:59.999Z'),
        },
        origin: 'ezmesure-admin',
        shouldWriteActivity: false,
      },
      result: {
        success: false,
        detail: {
          createdAt: new Date('2024-12-18T07:58:38.549Z'),
          destroyAt: new Date('2024-12-25T07:58:38.549Z'),
          took: 470,
          taskId: '9a0f8b83-ae34-4768-8d08-1646037a9e8d',
          files: {
            detail: '2024/2024-12/ezREEPORT_pr-searches_platform-annuel.det.json',
          },
          meta: {
            jobId: '1',
            jobAdded: new Date('2024-12-18T07:58:37.684Z'),
          },
          period: {
            start: new Date('2022-12-31T23:00:00.000Z'),
            end: new Date('2023-12-31T22:59:59.999Z'),
          },
          auth: {
            elastic: {
              username: 'report.77244590-5e04-11ee-bef0-fbc8021705d4',
            },
          },
          error: {
            message: 'No data found for given request. Please review filters or aggregations of figures.',
            stack: [
              'Error: No data found for given request. Please review filters or aggregations of figures.',
              'at checkEsErrors (/usr/dev/services/report/src/models/reports/generation/fetch/results.ts:52:11)',
              'at handleEsResponse (/usr/dev/services/report/src/models/reports/generation/fetch/results.ts:263:3)',
              'at <anonymous> (/usr/dev/services/report/src/models/reports/generation/fetch/index.ts:88:21)',
              'at Array.map (<anonymous>)',
              'at fetchElastic (/usr/dev/services/report/src/models/reports/generation/fetch/index.ts:82:29)',
              'at process.processTicksAndRejections (node:internal/process/task_queues:95:5)',
              'at asyncWithCommonHandlers (/usr/dev/services/report/src/lib/utils.ts:149:13)',
              'at async Promise.all (index 3)',
              'at generateReport (/usr/dev/services/report/src/models/reports/generation/index.ts:386:5)',
              'at generate (/usr/dev/services/report/src/models/queues/jobs/generate.ts:87:18)',
            ],
            cause: {
              layout: 3,
              figure: 'publisher : chronologie-mois-histo',
              elasticQuery: {
                index: '*-publisher*',
                body: [
                  {
                    query: {
                      bool: {
                        filter: [
                          {
                            match_phrase: {
                              Metric_Type: 'Searches_Platform',
                            },
                          },
                          {
                            match_phrase: {
                              'Report_Header.Report_ID': 'PR',
                            },
                          },
                          {
                            range: {
                              X_Date_Month: {
                                gte: '2023-01-01T00:00:00+01:00',
                                lte: '2023-12-31T23:59:59+01:00',
                                format: 'strict_date_optional_time',
                              },
                            },
                          },
                        ],
                        must_not: [],
                      },
                    },
                    aggregations: {
                      1: {
                        date_histogram: {
                          field: 'X_Date_Month',
                          calendar_interval: 'month',
                          order: {
                            _count: 'desc',
                          },
                        },
                        aggregations: {
                          2: {
                            terms: {
                              field: 'X_Package',
                              order: {
                                _count: 'desc',
                              },
                            },
                            aggregations: {
                              metric: {
                                sum: {
                                  field: 'Count',
                                },
                              },
                            },
                          },
                          metric: {
                            sum: {
                              field: 'Count',
                            },
                          },
                        },
                      },
                      metric: {
                        sum: {
                          field: 'Count',
                        },
                      },
                    },
                    size: 0,
                    track_total_hits: true,
                  },
                ],
              },
            },
          },
        },
      },
      progress: 0,
      added: new Date('2024-12-18T07:58:37.684Z'),
      started: new Date('2024-12-18T07:58:37.688Z'),
      ended: new Date('2024-12-18T07:58:39.042Z'),
      attempts: 1,
      status: 'completed',
    },
  },
};
