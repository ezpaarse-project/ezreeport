// import migration from './version.js';
import migrate100Beta19 from './1_0_0-beta_19.js';
import migrate100Beta22 from './1_0_0-beta_22.js';
import migrate200 from './2_0_0.js';
import migrate320 from './3_2_0.js';

export default {
  // [migration.name]: migration
  [migrate100Beta19.name]: migrate100Beta19,
  [migrate100Beta22.name]: migrate100Beta22,
  [migrate200.name]: migrate200,
  [migrate320.name]: migrate320,
};
