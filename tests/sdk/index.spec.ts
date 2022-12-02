import authTests from './auth.spec';
import healthTests from './health.spec';

describe('SDK', () => {
  describe('health', healthTests());

  describe('auth', authTests());
});
