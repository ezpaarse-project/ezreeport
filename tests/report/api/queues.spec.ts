import chai from 'chai';
import { step } from 'mocha-steps';
import config from '../../lib/config';
import { randomString } from '../../lib/utils';

const { expect } = chai;

export default (agent: ChaiHttp.Agent) => () => {
  describe('GET /queues', () => {
    const request = () => agent.get('/queues')
      .auth(config.EZMESURE_TOKEN, { type: 'bearer' });

    it('should return 200', async () => {
      // OK
      const res = await request();

      expect(res).to.have.status(200);
      expect(res.body.status).to.like({ code: 200, message: 'OK' });
    });

    it('should return array', async () => {
      // OK
      const res = await request();

      expect(res.body.content).to.be.an('array');
    });

    it('should return 400', async () => {
      // Random JWT
      const res = await request().auth(randomString(), { type: 'bearer' });

      expect(res).to.have.status(400);
      expect(res.body.status).to.like({ code: 400, message: 'Bad Request' });
    });

    it('should return 401', async () => {
      // No JWT
      const res = await request().auth('', { type: 'bearer' });

      expect(res).to.have.status(401);
      expect(res.body.status).to.like({ code: 401, message: 'Unauthorized' });
    });
  });

  describe('GET /queues/{queue}', () => {
    const request = () => agent.get(`/queues/${randomString()}`)
      .auth(config.EZMESURE_TOKEN, { type: 'bearer' });

    it('should return 400', async () => {
      // Random JWT
      const res = await request().auth(randomString(), { type: 'bearer' });

      expect(res).to.have.status(400);
      expect(res.body.status).to.like({ code: 400, message: 'Bad Request' });
    });

    it('should return 401', async () => {
      // No JWT
      const res = await request().auth('', { type: 'bearer' });

      expect(res).to.have.status(401);
      expect(res.body.status).to.like({ code: 401, message: 'Unauthorized' });
    });

    it('should return 404', async () => {
      // Random id
      const res = await request();

      expect(res).to.have.status(404);
      expect(res.body.status).to.like({ code: 404, message: 'Not Found' });
    });
  });

  describe('PUT /queues/{queue}/pause', () => {
    const request = () => agent.put(`/queues/${randomString()}/pause`)
      .auth(config.EZMESURE_TOKEN, { type: 'bearer' });

    it('should return 400', async () => {
      // Random JWT
      const res = await request().auth(randomString(), { type: 'bearer' });

      expect(res).to.have.status(400);
      expect(res.body.status).to.like({ code: 400, message: 'Bad Request' });
    });

    it('should return 401', async () => {
      // No JWT
      const res = await request().auth('', { type: 'bearer' });

      expect(res).to.have.status(401);
      expect(res.body.status).to.like({ code: 401, message: 'Unauthorized' });
    });

    it('should return 404', async () => {
      // Random id
      const res = await request();

      expect(res).to.have.status(404);
      expect(res.body.status).to.like({ code: 404, message: 'Not Found' });
    });
  });

  describe('PUT /queues/{queue}/resume', () => {
    const request = () => agent.put(`/queues/${randomString()}/resume`)
      .auth(config.EZMESURE_TOKEN, { type: 'bearer' });

    it('should return 400', async () => {
      // Random JWT
      const res = await request().auth(randomString(), { type: 'bearer' });

      expect(res).to.have.status(400);
      expect(res.body.status).to.like({ code: 400, message: 'Bad Request' });
    });

    it('should return 401', async () => {
      // No JWT
      const res = await request().auth('', { type: 'bearer' });

      expect(res).to.have.status(401);
      expect(res.body.status).to.like({ code: 401, message: 'Unauthorized' });
    });

    it('should return 404', async () => {
      // Random id
      const res = await request();

      expect(res).to.have.status(404);
      expect(res.body.status).to.like({ code: 404, message: 'Not Found' });
    });
  });

  describe('GET /queues/{queue}/{jobId}', () => {
    const request = () => agent.get(`/queues/${randomString()}/${randomString()}`)
      .auth(config.EZMESURE_TOKEN, { type: 'bearer' });

    it('should return 400', async () => {
      // Random JWT
      const res = await request().auth(randomString(), { type: 'bearer' });

      expect(res).to.have.status(400);
      expect(res.body.status).to.like({ code: 400, message: 'Bad Request' });
    });

    it('should return 401', async () => {
      // No JWT
      const res = await request().auth('', { type: 'bearer' });

      expect(res).to.have.status(401);
      expect(res.body.status).to.like({ code: 401, message: 'Unauthorized' });
    });

    it('should return 404', async () => {
      // Random id
      const res = await request();

      expect(res).to.have.status(404);
      expect(res.body.status).to.like({ code: 404, message: 'Not Found' });
    });
  });

  describe('POST /queues/{queue}/{jobId}/retry', () => {
    const request = () => agent.post(`/queues/${randomString()}/${randomString()}/retry`)
      .auth(config.EZMESURE_TOKEN, { type: 'bearer' });

    it('should return 400', async () => {
      // Random JWT
      const res = await request().auth(randomString(), { type: 'bearer' });

      expect(res).to.have.status(400);
      expect(res.body.status).to.like({ code: 400, message: 'Bad Request' });
    });

    it('should return 401', async () => {
      // No JWT
      const res = await request().auth('', { type: 'bearer' });

      expect(res).to.have.status(401);
      expect(res.body.status).to.like({ code: 401, message: 'Unauthorized' });
    });

    it('should return 404', async () => {
      // Random id
      const res = await request();

      expect(res).to.have.status(404);
      expect(res.body.status).to.like({ code: 404, message: 'Not Found' });
    });
  });

  describe('Test course', () => {
    // Testing on "mail" queue, because it's the bridge between 2 services (report & mail)
    const queue = 'mail';

    step('GET /queues', async () => {
      const res = await agent.get('/queues')
        .auth(config.EZMESURE_TOKEN, { type: 'bearer' });

      expect(res).to.have.status(200);
      expect(res.body.status).to.like({ code: 200, message: 'OK' });

      expect(res.body.content).to.be.an('array');

      const t = res.body.content.find((q: string) => q === queue);
      expect(t).to.not.equal(null);
    });

    let obj: any;
    step('PUT /queue/{queue}/pause', async () => {
      const res = await agent.put(`/queus/${queue}/pause`)
        .auth(config.EZMESURE_TOKEN, { type: 'bearer' });

      expect(res).to.have.status(200);
      expect(res.body).to.like({
        status: { code: 200, message: 'OK' },
        content: { status: 'paused' },
      });
      obj = res.body.content;
    });

    step('GET /queue/{queue}', async () => {
      const res = await agent.get(`/queus/${queue}`)
        .auth(config.EZMESURE_TOKEN, { type: 'bearer' });

      expect(res).to.have.status(200);
      expect(res.body).to.like({
        status: { code: 200, message: 'OK' },
        content: obj,
      });
    });

    step('PUT /queue/{queue}/resume', async () => {
      const res = await agent.put(`/queus/${queue}/resume`)
        .auth(config.EZMESURE_TOKEN, { type: 'bearer' });

      expect(res).to.have.status(200);
      expect(res.body).to.like({
        status: { code: 200, message: 'OK' },
        content: { status: 'active' },
      });
      obj = res.body.content;
    });

    step('GET /queue/{queue}/{jobId}', async () => {
      const jobId = obj.jobs[0].id;
      const res = await agent.put(`/queus/${queue}/${jobId}`)
        .auth(config.EZMESURE_TOKEN, { type: 'bearer' });

      expect(res).to.have.status(200);
      expect(res.body).to.like({
        status: { code: 200, message: 'OK' },
        content: { id: jobId },
      });
    });
  });
};
