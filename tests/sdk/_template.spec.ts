import chai from 'chai';

const { expect } = chai;

export default () => () => {
  describe('toString()', () => {
    const request = '-'.toString();

    it('should ...', async () => {
      const { length } = await request;

      expect(length).to.be.equal(1);
    });
  });
};
