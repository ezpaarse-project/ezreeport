import chai from 'chai';
import { step } from 'mocha-steps';
import { crons } from 'reporting-sdk-js';
import config from '~/lib/config';
import type { JsonSchema } from '~/lib/jsonSchema';

const { expect } = chai;

const cronSchema: JsonSchema<crons.Cron> = {
  type: 'object',
  required: ['name', 'running'],
  properties: {
    name: {
      type: 'string',
    },
    running: {
      type: 'boolean',
    },
    nextRun: {
      type: ['object', 'null', 'undefined'],
      format: ['date-object', 'undefined'],
    },
    lastRun: {
      type: ['object', 'null', 'undefined'],
      format: ['date-object', 'undefined'],
    },
  },
};

export default () => {
  describe('getAllCrons()', () => {
    let res: ReturnType<typeof crons.getAllCrons> | undefined;

    // eslint-disable-next-line func-names
    it('should return array of cron', async function () {
      this.timeout(5000);
      if (!res) {
        res = crons.getAllCrons();
      }
      const { content } = await res;

      expect(content).to.be.jsonSchema({
        type: 'array',
        items: cronSchema,
      });
    });

    // eslint-disable-next-line func-names
    it('should return one cron', async function () {
      this.timeout(5000);
      if (!res) {
        res = crons.getAllCrons();
      }
      const { content } = await res;

      expect(
        content.findIndex(({ name }) => name === config.SDK_REPORT_CRON),
      ).to.be.not.equal(-1);
    });
  });

  describe('getCron(<string>)', () => {
    let res: ReturnType<typeof crons.getCron> | undefined;

    it('should return a cron', async () => {
      if (!res) {
        res = crons.getCron(config.SDK_REPORT_CRON);
      }
      const { content } = await res;

      expect(content).to.be.jsonSchema(cronSchema);
    });

    it('should return correct cron', async () => {
      if (!res) {
        res = crons.getCron(config.SDK_REPORT_CRON);
      }
      const { content } = await res;

      expect(content.name).to.be.equal(config.SDK_REPORT_CRON);
    });
  });

  describe('forceCron(<string>)', () => {
    let res: ReturnType<typeof crons.forceCron> | undefined;

    it('should return a cron', async () => {
      if (!res) {
        res = crons.forceCron(config.SDK_REPORT_CRON);
      }
      const { content } = await res;

      expect(content).to.be.jsonSchema(cronSchema);
    });

    it('should return correct cron', async () => {
      if (!res) {
        res = crons.getCron(config.SDK_REPORT_CRON);
      }
      const { content } = await res;

      expect(content.name).to.be.equal(config.SDK_REPORT_CRON);
    });

    // it('should have current time for lastRun', async () => {
    //   if (!res) {
    //     res = crons.forceCron(config.SDK_REPORT_CRON);
    //   }
    //   const { content } = await res;

    //   // +/- few ms
    //   expect(content.lastRun).to.be.equal((new Date()).toISOString());
    // });
  });

  describe('Test course', () => {
    step('stopCron(<string>)', async () => {
      const { content } = await crons.stopCron(config.SDK_REPORT_CRON);

      expect(content).to.be.jsonSchema(cronSchema);
      expect(content.name).to.be.equal(config.SDK_REPORT_CRON);
      expect(content.running).to.be.equal(false);
    });

    step('startCron(<string>)', async () => {
      const { content } = await crons.startCron(config.SDK_REPORT_CRON);

      expect(content).to.be.jsonSchema(cronSchema);
      expect(content.name).to.be.equal(config.SDK_REPORT_CRON);
      expect(content.running).to.be.equal(true);
    });
  });
};
