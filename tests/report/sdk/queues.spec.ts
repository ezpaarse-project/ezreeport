import chai from 'chai';
import { step } from 'mocha-steps';
import { queues } from 'reporting-sdk-js';
import config from '../../lib/config';
import type { JsonSchema } from '../../lib/jsonSchema';

const { expect } = chai;

const queueSchema: JsonSchema<queues.Queue<object, object>> = {
  type: 'object',
  required: ['status', 'jobs'],
  properties: {
    status: {
      type: 'string',
    },
    jobs: {
      type: 'array',
      items: {
        type: 'object',
      },
    },
  },
};

const jobSchema: JsonSchema<queues.FullJob<object, object>> = {
  type: 'object',
  required: ['id', 'data', 'progress', 'added', 'attemps', 'status'],
  properties: {
    id: {
      type: 'string',
    },
    data: {
      type: 'object',
    },
    result: {
      type: 'object',
    },
    progress: {
      type: 'number',
    },
    added: {
      type: 'object',
      format: 'date-object',
    },
    started: {
      type: ['object', 'null', 'undefined'],
      format: ['date-object', 'undefined'],
    },
    ended: {
      type: ['object', 'null', 'undefined'],
      format: ['date-object', 'undefined'],
    },
    attemps: {
      type: 'number',
    },
    status: {
      type: 'string',
    },
  },
};

export default () => {
  describe('getAllQueues()', () => {
    let res: ReturnType<typeof queues.getAllQueues> | undefined;

    it('should return queues', async () => {
      if (!res) {
        res = queues.getAllQueues();
      }
      const { content } = await res;

      // eslint-disable-next-line no-restricted-syntax
      for (const queue of content) {
        expect(queue).to.be.jsonSchema({ type: 'string' });
      }
    });

    it('should contains one specific queue', async () => {
      if (!res) {
        res = queues.getAllQueues();
      }
      const { content } = await res;

      expect(
        content.findIndex((name) => name === config.SDK_REPORT_QUEUE),
      ).to.be.not.equal(-1);
    });
  });

  describe('getQueue(<string>)', () => {
    let res: ReturnType<typeof queues.getQueue> | undefined;

    it('should return a queue', async () => {
      if (!res) {
        res = queues.getQueue(config.SDK_REPORT_QUEUE);
      }
      const { content } = await res;

      expect(content).to.be.jsonSchema(queueSchema);
    });
  });

  describe('getJob(<string>)', () => {
    let res: ReturnType<typeof queues.getJob> | undefined;

    it('should return a job', async () => {
      if (!res) {
        res = queues.getJob(config.SDK_REPORT_QUEUE, config.SDK_REPORT_QUEUE_JOB);
      }
      const { content } = await res;

      expect(content).to.be.jsonSchema(jobSchema);
    });
  });

  describe('retryJob(<string>)', () => {
    let res: ReturnType<typeof queues.retryJob> | undefined;

    it('should return a queue', async () => {
      if (!res) {
        res = queues.retryJob(config.SDK_REPORT_QUEUE, config.SDK_REPORT_QUEUE_JOB);
      }
      const { content } = await res;

      expect(content).to.be.jsonSchema(jobSchema);
    });
  });

  describe('Test course', () => {
    step('pauseQueue(<string>)', async () => {
      const { content } = await queues.pauseQueue(config.SDK_REPORT_QUEUE);

      expect(content).to.be.jsonSchema(queueSchema);
      expect(content.status).to.be.equal('paused');
    });

    step('resumeQueue(<string>)', async () => {
      const { content } = await queues.resumeQueue(config.SDK_REPORT_QUEUE);

      expect(content).to.be.jsonSchema(queueSchema);
      expect(content.status).to.be.equal('active');
    });
  });
};
