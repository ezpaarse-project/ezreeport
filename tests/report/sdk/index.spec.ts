import chai from 'chai';
import chaiJsonSchema from 'chai-json-schema';
import { setup } from 'reporting-sdk-js';
import tv4Formats from 'tv4-formats';
import config from '../../lib/config';
import authTests from './auth.spec';
import cronsTests from './crons.spec';
import healthTests from './health.spec';
import historyTests from './history.spec';
import setupTests from './setup.spec';

chai.use(chaiJsonSchema);
chai.tv4.addFormat(tv4Formats);

export default () => {
  setup.setURL(config.REPORT_API);
  setup.login(config.EZMESURE_TOKEN);

  describe('setup', setupTests);

  describe('health', healthTests);

  describe('crons', cronsTests);

  describe('auth', authTests);

  describe('history', historyTests);
};
