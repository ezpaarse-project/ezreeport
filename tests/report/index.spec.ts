import integrationTests from './api/index.spec';
import sdkTests from './sdk/index.spec';

describe('Report', () => {
  describe('API', integrationTests);
  describe('SDK', sdkTests);
});
