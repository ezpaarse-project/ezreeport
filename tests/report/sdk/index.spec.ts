import chai from 'chai';
import chaiJsonSchema from 'chai-json-schema';
import { setup } from 'reporting-sdk-js';
import tv4Formats from 'tv4-formats';
import config from '../../lib/config';
import authTests from './auth.spec';
import cronsTests from './crons.spec';
import healthTests from './health.spec';
import historyTests from './history.spec';
import queuesTests from './queues.spec';
import reportsTests from './reports.spec';
import setupTests from './setup.spec';
import tasksTests from './tasks.spec';
import templatesTests from './templates.spec';

chai.use(chaiJsonSchema);
chai.tv4.addFormat(tv4Formats);
chai.tv4.addFormat('date-object', (data) => {
  if (data instanceof Date) return null;
  return 'not a valid date';
});

export default () => {
  setup.setURL(config.REPORT_API);
  setup.login(config.EZMESURE_TOKEN);

  describe('setup', setupTests);

  describe('health', healthTests);

  describe('crons', cronsTests);

  describe('queues', queuesTests);

  describe('auth', authTests);

  describe('history', historyTests);

  describe('tasks', tasksTests);

  describe('reports', reportsTests);

  describe('templates', templatesTests);
};
