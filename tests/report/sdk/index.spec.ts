import chai from 'chai';
import chaiJsonSchema from 'chai-json-schema';
import { setup } from 'reporting-sdk-js';
import config from '../../lib/config';
import setupTests from './setup.spec';

chai.use(chaiJsonSchema);
chai.tv4.addFormat('date-time', (data) => {
  if (data instanceof Date) return null;
  return 'not a valid date';
});

export default () => {
  setup.setURL(config.REPORT_API);
  setup.login(config.EZMESURE_TOKEN);

  describe('setup', setupTests);

};
