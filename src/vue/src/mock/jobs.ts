import type { queues } from 'ezreeport-sdk-js';

const data: queues.FullJob<unknown, unknown>[] = [{
  id: '183',
  data: {
    task: {
      id: '696bc968-6155-4258-85be-ef2fa53040a3',
      name: 'Tests de Slots',
      institution: 'institution:abba8400-1216-11eb-af77-ff33b5dd411e',
      template: { extends: 'tests/slot-tests' },
      targets: ['tom.test@test.fr'],
      recurrence: 'YEARLY',
      nextRun: '2023-11-16T08:35:02.591Z',
      lastRun: '2022-11-16T08:35:02.591Z',
      enabled: true,
      createdAt: '2022-11-07T13:18:34.130Z',
      updatedAt: '2023-01-23T14:09:23.454Z',
      history: [{
        id: 'b1800558-1183-40f9-b6a6-683531f28700', taskId: '696bc968-6155-4258-85be-ef2fa53040a3', type: 'generation-success', message: 'Rapport "2022/2022-11/reporting_ezMESURE_tests-de-slots_808e7a78-3386-4b6a-bb01-e994da196cab" généré par auto', data: { jobId: '4', jobAdded: '2022-11-16T06:33:00.089Z' }, createdAt: '2022-11-16T06:33:03.267Z',
      }, {
        id: 'e080340c-b217-4113-9615-f0d89d84926d', taskId: '696bc968-6155-4258-85be-ef2fa53040a3', type: 'generation-success', message: 'Rapport "2022/2022-11/reporting_ezMESURE_tests-de-slots_7ad82b0f-8ad8-4e35-97d3-52f771f0e110" généré par daily-cron-job', data: { jobId: '8', jobAdded: '2022-11-16T08:35:00.101Z' }, createdAt: '2022-11-16T08:35:03.340Z',
      }, {
        id: 'aa0fb45c-e293-4213-9b15-dcca1c3165b7', taskId: '696bc968-6155-4258-85be-ef2fa53040a3', type: 'edition', message: 'Tâche activée par ezmesure-admin', data: null, createdAt: '2023-01-23T13:51:20.000Z',
      }, {
        id: '149352bb-0ce5-49aa-beb8-1c3aa03863ff', taskId: '696bc968-6155-4258-85be-ef2fa53040a3', type: 'edition', message: 'Tâche désactivée par ezmesure-admin', data: null, createdAt: '2023-01-23T13:52:32.000Z',
      }, {
        id: '25140d42-a544-4f12-926f-6dbb8a627903', taskId: '696bc968-6155-4258-85be-ef2fa53040a3', type: 'edition', message: 'Tâche activée par ezmesure-admin', data: null, createdAt: '2023-01-23T13:52:37.000Z',
      }, {
        id: '6ffacdf4-a8c5-411a-b383-1690262dac50', taskId: '696bc968-6155-4258-85be-ef2fa53040a3', type: 'edition', message: 'Tâche désactivée par ezmesure-admin', data: null, createdAt: '2023-01-23T13:53:29.000Z',
      }, {
        id: 'c9f9f2db-3e28-4e9b-81f5-0e4549c278df', taskId: '696bc968-6155-4258-85be-ef2fa53040a3', type: 'edition', message: 'Tâche activée par ezmesure-admin', data: null, createdAt: '2023-01-23T13:53:31.000Z',
      }, {
        id: 'c89990e2-d96f-4896-8176-493b6a52e12c', taskId: '696bc968-6155-4258-85be-ef2fa53040a3', type: 'edition', message: 'Tâche désactivée par ezmesure-admin', data: null, createdAt: '2023-01-23T14:09:19.000Z',
      }, {
        id: 'da662ddc-b466-4f95-b3b2-8b94844bd395', taskId: '696bc968-6155-4258-85be-ef2fa53040a3', type: 'edition', message: 'Tâche activée par ezmesure-admin', data: null, createdAt: '2023-01-23T14:09:23.000Z',
      }],
    },
    origin: 'ezmesure-admin',
    writeHistory: false,
    debug: true,
  },
  result: {
    success: true,
    detail: {
      createdAt: '2023-02-16T10:46:43.064Z', destroyAt: '2023-02-23T10:46:43.064Z', took: 805, taskId: '696bc968-6155-4258-85be-ef2fa53040a3', files: { detail: '2023/2023-02/ezReeport_ezMESURE_tests-de-slots.det.json', debug: '2023/2023-02/ezReeport_ezMESURE_tests-de-slots.deb.json', report: '2023/2023-02/ezReeport_ezMESURE_tests-de-slots.rep.pdf' }, meta: { jobId: '183', jobAdded: '2023-02-16T10:46:40.267Z' }, runAs: 'tom.sublet', period: { start: '2022-01-01T00:00:00.000Z', end: '2022-12-31T23:59:59.999Z' }, sendingTo: ['tom.test@test.fr'], stats: { pageCount: 9, size: 127968 },
    },
  },
  progress: 1,
  added: new Date(Date.parse('2023-02-16T10:46:40.267Z')),
  started: new Date(Date.parse('2023-02-16T10:46:40.269Z')),
  ended: new Date(Date.parse('2023-02-16T10:46:43.873Z')),
  attempts: 1,
  status: 'completed',
}, {
  id: '182',
  data: {
    task: {
      id: 'af549626-641b-44ed-9381-f3b751370164',
      name: 'Test API',
      institution: 'institution:abba8400-1216-11eb-af77-ff33b5dd411e',
      template: { extends: 'basic', inserts: [{ at: 0, fetcher: 'none', figures: [{ data: '### Test', type: 'md', params: {} }] }], fetchOptions: { filters: { must_not: [{ match_phrase: { mime: { query: 'XLS' } } }, { match_phrase: { mime: { query: 'DOC' } } }, { match_phrase: { mime: { query: 'MISC' } } }, { match_phrase: { index_name: { query: 'bibcnrs-insb-dcm00' } } }, { match_phrase: { index_name: { query: 'bibcnrs-insb-dcm30' } } }, { match_phrase: { index_name: { query: 'bibcnrs-insb-dcm10' } } }, { match_phrase: { index_name: { query: 'bibcnrs-insb-anonyme' } } }] }, indexSuffix: '-*-2021' } },
      targets: ['tom.sublet@inist.test.fr'],
      recurrence: 'WEEKLY',
      nextRun: '2022-12-20T14:58:55.068Z',
      lastRun: '2022-12-02T14:58:55.068Z',
      enabled: true,
      createdAt: '2022-10-27T09:05:58.172Z',
      updatedAt: '2022-12-15T07:08:43.771Z',
      history: [{
        id: '0de4b2a4-bca4-47cc-9d91-c8c080941503', taskId: 'af549626-641b-44ed-9381-f3b751370164', type: 'edition', message: 'Tâche éditée par tom.sublet', data: null, createdAt: '2022-11-07T15:06:24.000Z',
      }, {
        id: 'bebec9b2-8c2b-44d0-b740-4c0a766c59bc', taskId: 'af549626-641b-44ed-9381-f3b751370164', type: 'generation-error', message: 'Rapport "2022/2022-11/reporting_ezMESURE_test-api_fd3526e3-7fc9-48a9-8d30-b6f2f8cfd54d" non généré par tom.sublet suite à une erreur.', data: null, createdAt: '2022-11-07T15:16:37.000Z',
      }, {
        id: 'a877468c-4130-4f30-a429-0852999b259f', taskId: 'af549626-641b-44ed-9381-f3b751370164', type: 'generation-success', message: 'Rapport "2022/2022-11/reporting_ezMESURE_test-api_8f4d4c51-bfbc-46c7-ae2c-505bab24d052" généré par daily-cron-job', data: { jobId: '7', jobAdded: '2022-11-16T08:35:00.100Z' }, createdAt: '2022-11-16T08:35:05.230Z',
      }, {
        id: '2fdd9f4c-1ac5-49a1-b988-c33a590c4c94', taskId: 'af549626-641b-44ed-9381-f3b751370164', type: 'unsubscription', message: "tom.sublet@inist.test.fr s'est désinscrit de la liste de diffusion.", data: null, createdAt: '2022-11-24T08:25:44.000Z',
      }],
    },
    origin: 'ezmesure-admin',
    writeHistory: false,
    debug: false,
  },
  result: {
    success: false,
    detail: {
      createdAt: '2023-02-16T08:40:06.339Z', destroyAt: '2023-02-23T08:40:06.339Z', took: 118, taskId: 'af549626-641b-44ed-9381-f3b751370164', files: { detail: '2023/2023-02/ezReeport_ezMESURE_test-api.det.json' }, meta: { jobId: '182', jobAdded: '2023-02-16T08:40:05.682Z' }, runAs: 'tom.sublet', period: { start: '2022-12-12T00:00:00.000Z', end: '2022-12-18T23:59:59.999Z' }, error: { message: "ENOENT: no such file or directory, open 'templates/basic.json'", stack: ["Error: ENOENT: no such file or directory, open 'templates/basic.json'"] },
    },
  },
  progress: 0,
  added: new Date(Date.parse('2023-02-16T08:40:05.682Z')),
  started: new Date(Date.parse('2023-02-16T08:40:05.683Z')),
  ended: new Date(Date.parse('2023-02-16T08:40:06.464Z')),
  attempts: 1,
  status: 'completed',
}];

export default data;
