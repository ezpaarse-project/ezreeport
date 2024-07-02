import { type history, tasks } from '@ezpaarse-project/ezreeport-sdk-js';

const data: history.HistoryWithTask[] = [
  {
    id: '2b4f1c0f-8d5b-425c-9265-234fdfec66a5',
    type: 'edition',
    message: 'Tâche désactivée par admin',
    data: undefined,
    createdAt: new Date(Date.parse('2023-03-29T06:31:37.000Z')),
    task: {
      id: '5d6f6cbf-e9a9-4053-af84-e690600666aa',
      name: 'Test Access',
      namespace: {
        id: '117fad80-4d1c-443d-b0be-a3a6c3d804f1',
        name: 'My First Institution',
        logoId: undefined,
        createdAt: new Date(Date.parse('2023-03-24T10:05:19.579Z')),
        updatedAt: new Date(Date.parse('2023-03-24T10:22:36.419Z')),
      },
      recurrence: tasks.Recurrence.DAILY,
      nextRun: new Date(Date.parse('2023-03-30T00:00:00.000Z')),
      lastRun: undefined,
      enabled: false,
      createdAt: new Date(Date.parse('2023-03-24T10:34:02.491Z')),
      updatedAt: new Date(Date.parse('2023-03-29T06:31:37.556Z')),
    },
  },
  {
    id: '2c98eb6a-66cd-470b-95b8-6381861a7a56',
    type: 'edition',
    message: 'Tâche activée par admin',
    data: undefined,
    createdAt: new Date(Date.parse('2023-03-29T06:31:31.000Z')),
    task: {
      id: '5d6f6cbf-e9a9-4053-af84-e690600666aa',
      name: 'Test Access',
      namespace: {
        id: '117fad80-4d1c-443d-b0be-a3a6c3d804f1',
        name: 'My First Institution',
        logoId: undefined,
        createdAt: new Date(Date.parse('2023-03-24T10:05:19.579Z')),
        updatedAt: new Date(Date.parse('2023-03-24T10:22:36.419Z')),
      },
      recurrence: tasks.Recurrence.DAILY,
      nextRun: new Date(Date.parse('2023-03-30T00:00:00.000Z')),
      lastRun: undefined,
      enabled: false,
      createdAt: new Date(Date.parse('2023-03-24T10:34:02.491Z')),
      updatedAt: new Date(Date.parse('2023-03-29T06:31:37.556Z')),
    },
  },
  {
    id: '051cdbe2-bf0a-4d83-a18e-5240b1c9dc29',
    type: 'creation',
    message: 'Tâche créée par admin',
    data: undefined,
    createdAt: new Date(Date.parse('2023-03-24T13:10:41.598Z')),
    task: {
      id: '9081b705-b52c-4cb4-9e5e-bb018284c698',
      name: 'Test API',
      namespace: {
        id: 'c141ab04-d3e2-4f12-b8fc-5c8f4311311f',
        name: 'bibcnrs',
        logoId: undefined,
        createdAt: new Date(Date.parse('2023-03-24T13:23:04.688Z')),
        updatedAt: new Date(Date.parse('2023-03-24T13:23:04.688Z')),
      },
      recurrence: tasks.Recurrence.YEARLY,
      nextRun: new Date(Date.parse('2032-10-31T10:00:00.000Z')),
      lastRun: undefined,
      enabled: true,
      createdAt: new Date(Date.parse('2023-03-24T13:10:41.598Z')),
      updatedAt: new Date(Date.parse('2023-03-24T13:25:16.469Z')),
    },
  },
];

export default data;
