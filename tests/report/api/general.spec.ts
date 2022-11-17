import chai from 'chai';
import { randomString } from '../../lib/utils';

const { expect } = chai;

export default (agent: ChaiHttp.Agent) => () => {
  describe('GET /ping', () => {
    const request = () => agent.get('/ping');

    it('should return 204', async () => {
      const res = await request();

      expect(res).to.have.status(204);
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
