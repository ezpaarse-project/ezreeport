import chai from 'chai';
import chaiHttp from 'chai-http';
import { randomBytes } from 'crypto';
import config from '../lib/config';

const { expect } = chai;

chai.use(chaiHttp);

const request = chai.request(config.get('reportUrl'));

describe('Report', () => {
  describe('General', () => {
    it('ping should return 204', (done) => {
      request.get('/ping').end((_err, res) => {
        expect(res).to.have.status(204);
        done();
      });
    });

    it('random should return 404', (done) => {
      const url = `/${randomBytes(20).toString('base64')}`;
      request.get(url).end((_err, res) => {
        expect(res).to.have.status(404);
        done();
      });
    });
  });

  describe('Tasks', () => {
    const task: any = {
      layout: { noLayout: true },
      targets: ['tom.sublet@inist.fr'],
      recurrence: 'WEEKLY',
      nextRun: new Date(2022, 11, 25),
      enabled: false,
    };
    // it('should return ', () => {
    //   assert.equal([1, 2, 3].indexOf(4), -1);
    // });
  });
});
