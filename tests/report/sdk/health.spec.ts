import chai from 'chai';
import { health } from 'reporting-sdk-js';
import config from '~/lib/config';
import type { JsonSchema } from '~/lib/jsonSchema';

const { expect } = chai;

const pingSuccessSchema = {
  type: 'object',
  required: ['name', 'status', 'elapsedTime'],
  properties: {
    name: {
      type: 'string',
    },
    status: {
      type: 'boolean',
    },
    elapsedTime: {
      type: 'number',
    },
  },
};

const pingResultSchema: JsonSchema<health.PingResult> = {
  type: 'object',
  required: ['name', 'status'],
  properties: {
    name: {
      type: 'string',
    },
    status: {
      type: 'boolean',
    },
    elapsedTime: {
      type: ['number', 'null', 'undefined'],
    },
    error: {
      type: ['string', 'null', 'undefined'],
    },
  },
};

export default () => {
  describe('getAllConnectedServices()', () => {
    let res: ReturnType<typeof health.getAllConnectedServices> | undefined;

    it('should return current name', async () => {
      if (!res) {
        res = health.getAllConnectedServices();
      }
      const { content } = await res;

      expect(content.current).to.be.equal(config.SDK_REPORT_SERVICE);
    });

    it('should return array of services', async () => {
      if (!res) {
        res = health.getAllConnectedServices();
      }
      const { content } = await res;

      expect(content).to.be.jsonSchema({
        type: 'object',
        required: ['current', 'services'],
        properties: {
          current: {
            type: 'string',
          },
          services: {
            type: 'array',
            minItems: 1,
            uniqueItems: true,
            items: {
              type: 'string',
            },
          },
        },
      });
    });
  });

  describe('checkAllConnectedService()', () => {
    let res: ReturnType<typeof health.checkAllConnectedService> | undefined;

    it('should return array of ping', async () => {
      if (!res) {
        res = health.checkAllConnectedService();
      }
      const { content } = await res;

      // eslint-disable-next-line no-restricted-syntax
      for (const ping of content) {
        expect(ping).to.be.jsonSchema(pingResultSchema);
      }
    });

    it('should return all ok', async () => {
      if (!res) {
        res = health.checkAllConnectedService();
      }
      const { content } = await res;

      // eslint-disable-next-line no-restricted-syntax
      for (const ping of content) {
        expect(ping).to.be.jsonSchema(pingSuccessSchema);
      }
    });

    it('should return in less than 100ms', async () => {
      if (!res) {
        res = health.checkAllConnectedService();
      }
      const { content } = await res;

      expect(content).to.satisfies(
        (arr: health.PingResult[]) => arr.every((pong) => pong.status && pong.elapsedTime <= 100),
      );
    });
  });

  describe('checkConnectedService(<string>)', () => {
    let res: ReturnType<typeof health.checkConnectedService> | undefined;

    it('should return the correct service', async () => {
      if (!res) {
        res = health.checkConnectedService(config.SDK_REPORT_SERVICE);
      }
      const { content } = await res;

      expect(content).to.be.like({ status: true });
    });

    it('should return ok', async () => {
      if (!res) {
        res = health.checkConnectedService(config.SDK_REPORT_SERVICE);
      }
      const { content } = await res;

      expect(content).to.be.like({ status: true });
    });

    it('should return in less than 10ms', async () => {
      if (!res) {
        res = health.checkConnectedService(config.SDK_REPORT_SERVICE);
      }
      const { content } = await res;

      if (content.status) {
        expect(content.elapsedTime).to.be.lessThanOrEqual(10);
      } else {
        chai.assert.fail('Health check failed');
      }
    });
  });

  describe('checkCurrentService()', () => {
    let res: ReturnType<typeof health.checkCurrentService> | undefined;

    it('should return the correct service', async () => {
      if (!res) {
        res = health.checkCurrentService();
      }
      const { content } = await res;

      expect(content).to.be.like({ name: config.SDK_REPORT_SERVICE });
    });

    it('should return ok', async () => {
      if (!res) {
        res = health.checkCurrentService();
      }
      const { content } = await res;

      expect(content).to.be.like({ status: true });
    });

    it('should return in less than 10ms', async () => {
      if (!res) {
        res = health.checkCurrentService();
      }
      const { content } = await res;

      if (content.status) {
        expect(content.elapsedTime).to.be.lessThanOrEqual(10);
      } else {
        chai.assert.fail('Health check failed');
      }
    });
  });
};
