import { type history, tasks } from 'ezreeport-sdk-js';

const data: history.HistoryWithTask[] = [
  {
    id: 'd4996a6a-eace-4dd3-a555-a0126b46e990',
    type: 'creation',
    message: 'Tâche créée par ezmesure-admin',
    data: undefined,
    createdAt: new Date(Date.parse('2022-12-15T07:42:14.668Z')),
    task: {
      id: '5697d904-e547-46ef-8571-b6a2af1a4d6d',
      name: 'UnitTest task',
      institution: 'institution:54860870-1217-11eb-af77-ff33b5dd411e',
      recurrence: tasks.Recurrence.YEARLY,
      nextRun: '2023-12-15T07:42:14.601Z',
      lastRun: undefined,
      enabled: false,
      createdAt: '2022-12-15T07:42:14.668Z',
      updatedAt: '2022-12-15T07:42:14.668Z',
    },
  },
  {
    id: 'c3a054a3-24c3-4120-bfa8-939f328a8657',
    type: 'generation-error',
    message: 'Rapport "2022/2022-11/reporting_ezMESURE_bibcnrs-*:-report-1-v-2-1_c0192740-ac6d-48cf-b15d-91fbadcf3cbc" non généré par tom.sublet suite à une erreur.',
    data: {
      jobId: '77',
      jobAdded: '2022-11-24T11:40:34.441Z',
      files: {
        detail: '2022/2022-11/reporting_ezMESURE_bibcnrs-*:-report-1-v-2-1_c0192740-ac6d-48cf-b15d-91fbadcf3cbc.det.json',
      },
    },
    createdAt: new Date(Date.parse('2022-11-24T11:40:37.000Z')),
    task: {
      id: '7398ffd9-ab64-48d0-a854-5f0b28b3dca9',
      name: 'bibcnrs-*: report 1 v 2.1',
      institution: 'institution:abba8400-1216-11eb-af77-ff33b5dd411e',
      recurrence: tasks.Recurrence.WEEKLY,
      nextRun: '2021-11-23T08:35:02.720Z',
      lastRun: '2022-11-16T08:35:02.720Z',
      enabled: true,
      createdAt: '2022-11-14T09:18:35.194Z',
      updatedAt: '2023-01-13T09:26:36.345Z',
    },
  },
  {
    id: '2fdd9f4c-1ac5-49a1-b988-c33a590c4c94',
    type: 'unsubscription',
    message: "tom.sublet@inist.test.fr s'est désinscrit de la liste de diffusion.",
    data: undefined,
    createdAt: new Date(Date.parse('2022-11-24T08:25:44.000Z')),
    task: {
      id: 'af549626-641b-44ed-9381-f3b751370164',
      name: 'Test API',
      institution: 'institution:abba8400-1216-11eb-af77-ff33b5dd411e',
      recurrence: tasks.Recurrence.WEEKLY,
      nextRun: '2022-12-20T14:58:55.068Z',
      lastRun: '2022-12-02T14:58:55.068Z',
      enabled: true,
      createdAt: '2022-10-27T09:05:58.172Z',
      updatedAt: '2022-12-15T07:08:43.771Z',
    },
  },
];

export default data;
