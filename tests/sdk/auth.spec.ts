import chai from 'chai';
import { auth } from 'reporting-sdk-js';

const { expect } = chai;

export default () => () => {
  describe('getCurrentUser()', () => {
    const request = auth.getCurrentUser();

    it('should return 200', async () => {
      const { status } = await request;

      expect(status.code).to.be.equal(200);
    });
  });
};
