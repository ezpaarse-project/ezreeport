import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiLike from 'chai-like';
import config from '~/lib/config';
import cronSpec from './cron.spec';
import generalTests from './general.spec';
import healthTests from './health.spec';
import queuesTests from './queues.spec';
import tasksTests from './tasks.spec';

chai.use(chaiHttp);
chai.use(chaiLike);

const agent = chai.request(config.REPORT_API);

export default () => {
  describe('General', generalTests(agent));

  describe('Health', healthTests(agent));

  describe('Tasks', tasksTests(agent));

  describe('Queues', queuesTests(agent));

  describe('Crons', cronSpec(agent));
};
