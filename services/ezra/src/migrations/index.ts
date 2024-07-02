// import migration from './version.js';
import migrate100Beta19 from './1_0_0-beta_19.js';
import migrate100Beta22 from './1_0_0-beta_22.js';

export default {
  // [migration.name]: migration
  [migrate100Beta19.name]: migrate100Beta19,
  [migrate100Beta22.name]: migrate100Beta22,
};
