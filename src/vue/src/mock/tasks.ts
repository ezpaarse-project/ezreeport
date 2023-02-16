import { tasks } from 'ezreeport-sdk-js';

const data: tasks.FullTask[] = [
  {
    id: '7398ffd9-ab64-48d0-a854-5f0b28b3dca9',
    name: '(mock) bibcnrs-*: report 1 v 2.1',
    institution: 'institution:abba8400-1216-11eb-af77-ff33b5dd411e',
    template: {
      extends: 'tests/slot-tests',
      inserts: [
        {
          at: 0,
          figures: [
            {
              data: '### **Rapport hebdomadaire des consultations BibCNRS**\n\nCe rapport est destiné à montrer les consultations de BibCNRS des 10 instituts lors de la semaine écoulée.\n\n[![ezmesure](https://blog.ezpaarse.org/wp-content/uploads/2017/11/logo-ezMESURE.png)](https://ezmesure.couperin.org/)\n[![bibcnrs](https://www.inist.fr/wp-content/uploads/2018/07/bibcnrs-logo-visite-e1530711678757.png)](https://bib.cnrs.fr/)',
              type: 'md',
              params: {},
            },
          ],
        },
      ],
      fetchOptions: {
        filters: {
          must_not: [
            {
              match_phrase: {
                mime: {
                  query: 'XLS',
                },
              },
            },
            {
              match_phrase: {
                mime: {
                  query: 'DOC',
                },
              },
            },
            {
              match_phrase: {
                mime: {
                  query: 'MISC',
                },
              },
            },
            {
              match_phrase: {
                index_name: {
                  query: 'bibcnrs-insb-dcm00',
                },
              },
            },
            {
              match_phrase: {
                index_name: {
                  query: 'bibcnrs-insb-dcm30',
                },
              },
            },
            {
              match_phrase: {
                index_name: {
                  query: 'bibcnrs-insb-dcm10',
                },
              },
            },
            {
              match_phrase: {
                index_name: {
                  query: 'bibcnrs-insb-anonyme',
                },
              },
            },
          ],
        },
        indexSuffix: '-*-2021',
      },
    },
    targets: [
      'ezpaarse@couperin.mock.org',
      'dominique.lechaudel@inist.mock.fr',
      'frederic.truong@inist.mock.fr',
      'yannick.schurter@inist.mock.fr',
      'leo.felix@inist.mock.fr',
      'tom.sublet@inist.mock.fr',
    ],
    recurrence: tasks.Recurrence.WEEKLY,
    nextRun: new Date(Date.parse('2021-11-23T08:35:02.720Z')),
    lastRun: new Date(Date.parse('2022-11-16T08:35:02.720Z')),
    enabled: true,
    createdAt: new Date(Date.parse('2022-11-14T09:18:35.194Z')),
    updatedAt: new Date(Date.parse('2023-01-13T09:26:36.345Z')),
    history: [
      {
        id: '3d318ebb-110e-48f8-ab9a-c9f63d4f1c60',
        taskId: '7398ffd9-ab64-48d0-a854-5f0b28b3dca9',
        type: 'edition',
        message: 'Tâche éditée par tom.sublet',
        data: undefined,
        createdAt: new Date(Date.parse('2022-11-14T09:52:30.000Z')),
      },
      {
        id: 'e7eaf700-1a0b-4de5-976c-8bf366fa49f1',
        taskId: '7398ffd9-ab64-48d0-a854-5f0b28b3dca9',
        type: 'edition',
        message: 'Tâche éditée par tom.sublet',
        data: undefined,
        createdAt: new Date(Date.parse('2022-11-14T14:32:43.000Z')),
      },
      {
        id: '4282365e-779f-4d93-9b26-771f73f35472',
        taskId: '7398ffd9-ab64-48d0-a854-5f0b28b3dca9',
        type: 'edition',
        message: 'Tâche éditée par tom.sublet',
        data: undefined,
        createdAt: new Date(Date.parse('2022-11-14T14:33:07.000Z')),
      },
      {
        id: '5ae55e48-d4ae-4d1f-a8ed-9d4219f12276',
        taskId: '7398ffd9-ab64-48d0-a854-5f0b28b3dca9',
        type: 'generation-success',
        message: 'Rapport "2022/2022-11/reporting_ezMESURE_bibcnrs-*:-report-1-v-2-1_87bb7e0c-d0dc-4204-93a1-73142ad3b9ae" généré par tom.sublet',
        data: {
          jobId: '143',
          jobAdded: '2022-11-15T13:54:05.851Z',
          jobAttempts: 1,
        },
        createdAt: new Date(Date.parse('2022-11-15T13:54:11.155Z')),
      },
      {
        id: 'b86683b5-e70c-43fe-8f6b-b6a57406e228',
        taskId: '7398ffd9-ab64-48d0-a854-5f0b28b3dca9',
        type: 'generation-success',
        message: 'Rapport "2022/2022-11/reporting_ezMESURE_bibcnrs-*:-report-1-v-2-1_e524a804-9d10-46d1-8ae9-6002d278b82e" généré par auto',
        data: {
          jobId: '5',
          jobAdded: '2022-11-16T06:33:00.089Z',
        },
        createdAt: new Date(Date.parse('2022-11-16T06:33:05.551Z')),
      },
      {
        id: 'afc9879b-efe4-4171-93d6-d2ce19683f94',
        taskId: '7398ffd9-ab64-48d0-a854-5f0b28b3dca9',
        type: 'generation-success',
        message: 'Rapport "2022/2022-11/reporting_ezMESURE_bibcnrs-*:-report-1-v-2-1_63ddaa82-41b0-4693-a4e9-1f7e9f460b6a" généré par daily-cron-job',
        data: {
          jobId: '9',
          jobAdded: '2022-11-16T08:35:00.102Z',
        },
        createdAt: new Date(Date.parse('2022-11-16T08:35:05.610Z')),
      },
      {
        id: '75ae6679-df98-45ad-b8da-2d7e62169681',
        taskId: '7398ffd9-ab64-48d0-a854-5f0b28b3dca9',
        type: 'generation-error',
        message: 'Rapport "2022/2022-11/reporting_ezMESURE_bibcnrs-*:-report-1-v-2-1_aa6017f8-1b2e-4d11-98ad-43193342b0b7" non généré par tom.sublet suite à une erreur.',
        data: {
          jobId: '28',
          jobAdded: '2022-11-18T14:45:36.660Z',
        },
        createdAt: new Date(Date.parse('2022-11-18T14:45:39.431Z')),
      },
      {
        id: 'c3a054a3-24c3-4120-bfa8-939f328a8657',
        taskId: '7398ffd9-ab64-48d0-a854-5f0b28b3dca9',
        type: 'generation-error',
        message: 'Rapport "2022/2022-11/reporting_ezMESURE_bibcnrs-*:-report-1-v-2-1_c0192740-ac6d-48cf-b15d-91fbadcf3cbc" non généré par tom.sublet suite à une erreur.',
        data: {
          jobId: '77',
          jobAdded: '2022-11-24T11:40:34.441Z',
        },
        createdAt: new Date(Date.parse('2022-11-24T11:40:37.000Z')),
      },
    ],
  },
  {
    id: '696bc968-6155-4258-85be-ef2fa53040a3',
    name: '(mock) Tests de Slots',
    institution: 'institution:abba8400-1216-11eb-af77-ff33b5dd411e',
    template: {
      extends: 'tests/slot-tests',
    },
    targets: [
      'tom.sublet@inist.mock.fr',
      'tom.test@test.mock.fr',
    ],
    recurrence: tasks.Recurrence.YEARLY,
    nextRun: new Date(Date.parse('2023-11-16T08:35:02.591Z')),
    lastRun: new Date(Date.parse('2022-11-16T08:35:02.591Z')),
    enabled: false,
    createdAt: new Date(Date.parse('2022-11-07T13:18:34.130Z')),
    updatedAt: new Date(Date.parse('2022-12-09T08:10:57.415Z')),
    history: [
      {
        id: 'b1800558-1183-40f9-b6a6-683531f28700',
        taskId: '696bc968-6155-4258-85be-ef2fa53040a3',
        type: 'generation-success',
        message: 'Rapport "2022/2022-11/reporting_ezMESURE_tests-de-slots_808e7a78-3386-4b6a-bb01-e994da196cab" généré par auto',
        data: {
          jobId: '4',
          jobAdded: '2022-11-16T06:33:00.089Z',
        },
        createdAt: new Date(Date.parse('2022-11-16T06:33:03.267Z')),
      },
      {
        id: 'e080340c-b217-4113-9615-f0d89d84926d',
        taskId: '696bc968-6155-4258-85be-ef2fa53040a3',
        type: 'generation-success',
        message: 'Rapport "2022/2022-11/reporting_ezMESURE_tests-de-slots_7ad82b0f-8ad8-4e35-97d3-52f771f0e110" généré par daily-cron-job',
        data: {
          jobId: '8',
          jobAdded: '2022-11-16T08:35:00.101Z',
        },
        createdAt: new Date(Date.parse('2022-11-16T08:35:03.340Z')),
      },
    ],
  },
];

export default data;
