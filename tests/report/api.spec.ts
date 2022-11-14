import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiLike from 'chai-like';
import { pick } from 'lodash';
import { step } from 'mocha-steps';
import { randomBytes } from 'node:crypto';
import type { createTask } from 'reporting-report/models/tasks';
import config from '../lib/config';

const { expect } = chai;

chai.use(chaiHttp);
chai.use(chaiLike);

const agent = chai.request(config.REPORT_API);

type Task = Awaited<ReturnType<typeof createTask>>;

const randomString = () => randomBytes(20).toString('base64').replace(/[?/]/g, '_');

export default () => {
  describe('General', () => {
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
  });

  describe('Tasks', () => {
    describe('POST /tasks', () => {
      const request = () => agent.post('/tasks')
        .auth(config.EZMESURE_TOKEN, { type: 'bearer' });

      let errorMsg = '';
      it('should return 400 (body)', async () => {
        // No body
        const res = await request();

        expect(res).to.have.status(400);
        expect(res.body.status).to.like({ code: 400, message: 'Bad Request' });
        expect(res.body.content?.message).not.equal(errorMsg);
        errorMsg = res.body.content?.message;
      });

      it('should return 400 (jwt)', async () => {
        // Random JWT
        const res = await request().auth(randomString(), { type: 'bearer' });

        expect(res).to.have.status(400);
        expect(res.body.status).to.like({ code: 400, message: 'Bad Request' });
        expect(res.body.content?.message).not.equal(errorMsg);
        errorMsg = res.body.content?.message;
      });

      it('should return 401', async () => {
        // No JWT
        const res = await request().auth('', { type: 'bearer' });

        expect(res).to.have.status(401);
        expect(res.body.status).to.like({ code: 401, message: 'Unauthorized' });
      });
    });

    describe('GET /tasks', () => {
      const request = () => agent.get('/tasks')
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

    describe('GET /tasks/{taskId}', () => {
      const request = () => agent.get(`/tasks/${randomString()}`)
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

    describe('PUT /tasks/{taskId}', () => {
      const request = () => agent.put(`/tasks/${randomString()}`)
        .auth(config.EZMESURE_TOKEN, { type: 'bearer' });

      let errorMsg = '';
      it('should return 400 (body)', async () => {
        // No body
        const res = await request();

        expect(res).to.have.status(400);
        expect(res.body.status).to.like({ code: 400, message: 'Bad Request' });
        expect(res.body.content?.message).not.equal(errorMsg);
        errorMsg = res.body.content?.message;
      });

      it('should return 400 (jwt)', async () => {
        // Random JWT
        const res = await request().auth(randomString(), { type: 'bearer' });

        expect(res).to.have.status(400);
        expect(res.body.status).to.like({ code: 400, message: 'Bad Request' });
        expect(res.body.content?.message).not.equal(errorMsg);
        errorMsg = res.body.content?.message;
      });

      it('should return 401', async () => {
        // No JWT
        const res = await request().auth('', { type: 'bearer' });

        expect(res).to.have.status(401);
        expect(res.body.status).to.like({ code: 401, message: 'Unauthorized' });
      });

      it('should return 404', async () => {
        // Random id
        const res = await request().type('json').send({
          name: 'test task',
          layout: {
            extends: 'basic',
          },
          targets: ['fake@inist.fr'],
          recurrence: 'WEEKLY',
          nextRun: new Date(9999, 0, 1),
          enabled: false,
        });

        expect(res).to.have.status(404);
        expect(res.body.status).to.like({ code: 404, message: 'Not Found' });
      });
    });

    describe('DELETE /tasks/{taskId}', () => {
      const request = () => agent.delete(`/tasks/${randomString()}`)
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
      // Create task, check if in get all, edits, check if in get one, delete
      let task = {
        name: 'test task',
        layout: {
          extends: 'basic',
        },
        targets: ['fake@inist.fr'],
        recurrence: 'WEEKLY',
        nextRun: new Date(9999, 11, 25),
        enabled: false,
      } as unknown as Task;

      step('POST /tasks', async () => {
        const res = await agent.post('/tasks')
          .auth(config.EZMESURE_TOKEN, { type: 'bearer' })
          .type('json').send(task);

        expect(res).to.have.status(201);
        expect(res.body).to.like({
          status: { code: 201, message: 'Created' },
          content: { ...task, nextRun: task.nextRun?.toISOString() },
        });

        task = res.body.content;
      });

      step('GET /tasks', async () => {
        const res = await agent.get('/tasks')
          .auth(config.EZMESURE_TOKEN, { type: 'bearer' });

        expect(res).to.have.status(200);
        expect(res.body.status).to.like({ code: 200, message: 'OK' });

        expect(res.body.content).to.be.an('array');

        const t = res.body.content.find(({ id }: Task) => id === task.id);
        expect(t).to.like(
          pick(
            task,
            'id',
            'name',
            'institution',
            'recurrence',
            'nextRun',
            'enabled',
            'createdAt',
            'updatedAt',
          ),
        );
      });

      step('PUT /tasks/{taskId}', async () => {
        const { id } = task;
        task = {
          name: 'test task',
          layout: {
            extends: 'basic',
          },
          targets: ['fake@inist.fr', 'fake2@inist.fr'],
          recurrence: 'WEEKLY',
          nextRun: new Date(9999, 10, 25),
          enabled: false,
        } as unknown as Task;

        const res = await agent.put(`/tasks/${id}`)
          .auth(config.EZMESURE_TOKEN, { type: 'bearer' })
          .type('json').send(task);

        expect(res).to.have.status(200);
        expect(res.body).to.like({
          status: { code: 200, message: 'OK' },
          content: { ...task, nextRun: task.nextRun?.toISOString() },
        });
        task = res.body.content;
      });

      step('GET /tasks/{taskId}', async () => {
        const res = await agent.get(`/tasks/${task.id}`)
          .auth(config.EZMESURE_TOKEN, { type: 'bearer' });

        expect(res).to.have.status(200);
        expect(res.body).to.like({
          status: { code: 200, message: 'OK' },
          content: task,
        });
      });

      step('DELETE /tasks/{taskId}', async () => {
        const res = await agent.delete(`/tasks/${task.id}`)
          .auth(config.EZMESURE_TOKEN, { type: 'bearer' });

        expect(res).to.have.status(200);
        expect(res.body).to.like({
          status: { code: 200, message: 'OK' },
          content: task,
        });
      });
    });
  });
};
