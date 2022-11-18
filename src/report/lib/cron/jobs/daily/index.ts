/* eslint-disable import/no-import-module-exports */
import generateDailyReports from './generateDailyReports';
import purgeDailyFiles from './purgeDailyFiles';

module.exports = () => Promise.allSettled([
  generateDailyReports(),
  purgeDailyFiles(),
]);
