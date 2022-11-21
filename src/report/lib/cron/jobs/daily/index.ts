/* eslint-disable import/no-import-module-exports */
import { sendError } from '../utils';
import generateDailyReports from './generateDailyReports';
import purgeDailyFiles from './purgeDailyFiles';

const sE = (e: Error, o: string) => sendError(e, o, 'DAILY');

module.exports = () => Promise.allSettled([
  generateDailyReports().catch((e) => sE(e, 'generateDailyReports')),
  purgeDailyFiles().catch((e) => sE(e, 'purgeDailyFiles')),
]);
