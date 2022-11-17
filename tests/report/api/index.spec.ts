import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiLike from 'chai-like';
import config from '../../lib/config';
import generalTests from './general.spec';
import tasksTests from './tasks.spec';

chai.use(chaiHttp);
chai.use(chaiLike);

const agent = chai.request(config.REPORT_API);

export default () => {
  describe('General', generalTests(agent));

  describe('Tasks', tasksTests(agent));
};
