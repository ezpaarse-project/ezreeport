import chai from 'chai';
import { step } from 'mocha-steps';
import config from '~/lib/config';
import { randomString } from '~/lib/utils';

const { expect } = chai;

export default (agent: ChaiHttp.Agent) => () => {
  describe('GET /crons', () => {
    const request = () => agent.get('/crons')
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

  describe('GET /crons/{cron}', () => {
    const request = () => agent.get(`/crons/${randomString()}`)
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

  describe('PUT /crons/{cron}/stop', () => {
    const request = () => agent.put(`/crons/${randomString()}/start`)
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

  describe('PUT /crons/{cron}/start', () => {
    const request = () => agent.put(`/crons/${randomString()}/stop`)
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
    let cron: { name: string, running: boolean, lastRun: string, nextRun: string } | undefined;

    step('GET /crons', async () => {
      const res = await agent.get('/crons')
        .auth(config.EZMESURE_TOKEN, { type: 'bearer' });

      expect(res).to.have.status(200);
      expect(res.body.status).to.like({ code: 200, message: 'OK' });

      expect(res.body.content).to.be.an('array');

      const t = res.body.content[0];
      expect(t).to.not.equal(null);
      cron = t;
    });

    step('PUT /crons/{cron}/stop', async () => {
      const res = await agent.put(`/crons/${cron?.name}/stop`)
        .auth(config.EZMESURE_TOKEN, { type: 'bearer' });

      expect(res).to.have.status(200);
      expect(res.body).to.like({
        status: { code: 200, message: 'OK' },
        content: { runnnig: false },
      });
      cron = res.body.content;
    });

    step('GET /crons/{cron}', async () => {
      const res = await agent.get(`/crons/${cron}`)
        .auth(config.EZMESURE_TOKEN, { type: 'bearer' });

      expect(res).to.have.status(200);
      expect(res.body).to.like({
        status: { code: 200, message: 'OK' },
        content: cron,
      });
    });

    step('PUT /crons/{cron}/start', async () => {
      const res = await agent.put(`/crons/${cron?.name}/start`)
        .auth(config.EZMESURE_TOKEN, { type: 'bearer' });

      expect(res).to.have.status(200);
      expect(res.body).to.like({
        status: { code: 200, message: 'OK' },
        content: { runnnig: false },
      });
      cron = res.body.content;
    });
  });
};
