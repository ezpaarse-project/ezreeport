import chai from 'chai';
import { setup } from 'reporting-sdk-js';
import config from '~/lib/config';

const { expect } = chai;

export default () => {
  describe('isLogged()', () => {
    it('should return true, because login()', () => {
      setup.login(config.EZMESURE_TOKEN);
      const isLogged = setup.isLogged();

      expect(isLogged).to.be.equal(true);
    });

    it('should return false, because logout()', () => {
      setup.logout();
      const isLogged = setup.isLogged();

      expect(isLogged).to.be.equal(false);
      setup.login(config.EZMESURE_TOKEN);
    });
  });

  describe('isURLset()', () => {
    it('should return true, because setURL()', () => {
      setup.setURL(config.REPORT_API);
      const isURLset = setup.isURLset();

      expect(isURLset).to.be.equal(true);
    });

    it('should return false, because unsetURL()', () => {
      setup.unsetURL();
      const isURLset = setup.isURLset();

      expect(isURLset).to.be.equal(false);
      setup.setURL(config.REPORT_API);
    });
  });
};
