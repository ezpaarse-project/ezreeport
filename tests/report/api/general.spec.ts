import chai from 'chai';
import { randomString } from '../../lib/utils';

const { expect } = chai;

export default (agent: ChaiHttp.Agent) => () => {
  describe('GET /ping', () => {
    const request = () => agent.get('/ping');

    it('should return 200', async () => {
      const res = await request();

      expect(res).to.have.status(200);
    });

    it('should return self name', async () => {
      // OK
      const res = await request();

      expect(res.body.content.current).to.be.equal('reporting-report');
    });

    it('should return array', async () => {
      // OK
      const res = await request();

      expect(res.body.content.services).to.be.an('array');
    });
  });

  describe('GET /ping/all', () => {
    const request = () => agent.get('/ping/all');

    it('should return 200', async () => {
      const res = await request();

      expect(res).to.have.status(200);
    });

    it('should return array', async () => {
      // OK
      const res = await request();

      expect(res.body.content).to.be.an('array');
    });

    it('should return all ok', async () => {
      // All OK
      const res = await request();

      expect(res.body.content).to.satisfies(
        (arr: { success: boolean, time: number }[]) => arr.every(
          ({ success, time }) => success && time < 100,
        ),
      );
    });
  });

  describe('GET /ping/reporting-report', () => {
    const request = () => agent.get('/ping/reporting-report');

    it('should return 200', async () => {
      const res = await request();

      expect(res).to.have.status(200);
    });

    it('should return ok', async () => {
      // OK
      const res = await request();

      expect(res.body.content).to.be.like({ success: true });
    });

    it('should return less than 10ms', async () => {
      // OK
      const res = await request();

      expect(res.body.content.time).to.be.lessThanOrEqual(10);
    });
  });

  describe('GET /{random}', () => {
    const request = () => agent.get(`/${randomString()}`);

    it('should return 404', async () => {
      const res = await request();

      expect(res).to.have.status(404);
      expect(res.body.status).to.like({ code: 404, message: 'Not Found' });
    });
  });
};
