import chai from 'chai';
import { report } from 'reporting-sdk-js';
import config from '../../lib/config';

const { expect } = chai;

export default () => {
  describe('startAndListenGeneration(<string>)', () => {
    let result: Promise<report.ReportResult> | undefined;
    // eslint-disable-next-line prefer-arrow-callback, func-names
    it('should return success', async function () {
      this.timeout(5000);
      if (!result) {
        result = report.startAndListenGeneration(config.SDK_REPORT_TASK, { testEmails: ['tom.sublet@inist.fr'] });
      }
      const content = await result;

      // TODO: expect(result).to.be.jsonSchema(resultSchema);
      expect(content.success).to.be.equal(true);
    });
  });
};
