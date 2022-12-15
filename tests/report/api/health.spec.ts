import chai from 'chai';
import { randomString } from '../../lib/utils';

const { expect } = chai;

export default (agent: ChaiHttp.Agent) => () => {
  describe('GET /health', () => {
    const request = () => agent.get('/health');

    it('should return 200', async () => {
      const res = await request();

      expect(res).to.have.status(200);
    });
  });

  describe('GET /health/all', () => {
    const request = () => agent.get('/health/all');

    it('should return 200', async () => {
      const res = await request();

      expect(res).to.have.status(200);
    });
  });

  describe('GET /health/reporting-report', () => {
    const request = () => agent.get('/health/reporting-report');

    it('should return 200', async () => {
      const res = await request();

      expect(res).to.have.status(200);
    });
  });

  describe('GET /health/{random}', () => {
    const request = () => agent.get(`/health/${randomString()}`);

    it('should return 404', async () => {
      const res = await request();

      expect(res).to.have.status(404);
    });
  });
};
