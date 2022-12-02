import chai from 'chai';
import { health } from 'reporting-sdk-js';

const { expect } = chai;

export default () => () => {
  describe('getAllConnectedServices()', () => {
    const request = health.getAllConnectedServices();

    it('should return 200', async () => {
      const { status } = await request;

      expect(status.code).to.be.equal(200);
    });

    it('should return current name', async () => {
      // OK
      const { content } = await request;

      expect(content.current).to.be.equal('reporting-report');
    });

    it('should return array', async () => {
      // OK
      const { content } = await request;

      expect(content.services).to.be.an('array');
    });
  });

  describe('checkAllConnectedService()', () => {
    const request = health.checkAllConnectedService();

    it('should return 200', async () => {
      const { status } = await request;

      expect(status.code).to.be.equal(200);
    });

    it('should return array', async () => {
      // OK
      const { content } = await request;

      expect(content).to.be.an('array');
    });

    it('should return all ok', async () => {
      // All OK
      const { content } = await request;

      expect(content).to.satisfies(
        (arr: health.AnyPingResult[]) => arr.every(
          (res) => res.status && res.elapsedTime < 200,
        ),
      );
    });
  });

  describe('checkCurrentService()', () => {
    const request = health.checkCurrentService();

    it('should return 200', async () => {
      const { status } = await request;

      expect(status.code).to.be.equal(200);
    });

    it('should return ok', async () => {
      // OK
      const { content } = await request;

      expect(content).to.be.like({ status: true });
    });

    it('should return less than 10ms', async () => {
      // OK
      const { content } = await request;

      if (content.status) {
        expect(content.elapsedTime).to.be.lessThanOrEqual(10);
      } else {
        chai.assert.fail('Health check failed');
      }
    });
  });
};
