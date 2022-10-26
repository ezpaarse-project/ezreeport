import chai from 'chai';

const { expect } = chai;

export default () => {
  it('should return 2', (done) => {
    expect(1 + 1).to.be.equal(2);
    done();
  });
};
