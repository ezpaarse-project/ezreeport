import { CronJob } from 'cron';
import { differenceInMilliseconds } from 'date-fns';
import { StatusCodes } from 'http-status-codes';
import { HTTPError } from '../../types/errors';
import logger from '../logger';
import generateDailyReports from './jobs/generateDailyReports';

const dailyReports = new CronJob(
  process.env.NODE_ENV === 'production' ? '0 0 * * *' : '* * * * *',
  async () => {
    const start = new Date();
    logger.debug('[cron] [daily-report] Cron started');

    const { length } = await generateDailyReports();

    logger.info(`[cron] [daily-report] Cron ended in ${(differenceInMilliseconds(new Date(), start) / 60).toFixed(2)}s starting generation of ${length} reports`);
  },
  null,
  true,
  'Europe/Paris',
);

const crons = {
  'daily-report': dailyReports,
};

type Crons = keyof typeof crons;

/**
 * Check if given name is a valid cron name
 *
 * @param name Given name
 *
 * @returns Given name is a valid cron name
 */
const isCron = (name: string): name is Crons => Object.keys(crons).includes(name);

/**
 * Get specific cron
 *
 * @param name The name of the cron
 *
 * @returns The cron info
 */
export const getCron = (name: string) => {
  if (!isCron(name)) {
    // TODO[refactor]: Not an HTTP Error at this point
    throw new HTTPError(`Cron "${name}" not found`, StatusCodes.NOT_FOUND);
  }
  const cron = crons[name];

  return {
    name,
    running: cron.running,
    lastRun: cron.lastDate(),
    nextRun: cron.nextDate(),
  };
};

// TODO[feat]: Paginate
// TODO[feat]: Filter
/**
 * Get all crons
 *
 * @returns The crons info
 */
export const getAllCrons = () => Object.keys(crons).map((name) => getCron(name));

/**
 * Start specific cron
 *
 * @param name The cron name
 *
 * @returns The cron info
 */
export const startCron = (name: string) => {
  if (!isCron(name)) {
    // TODO[refactor]: Not an HTTP Error at this point
    throw new HTTPError(`Cron "${name}" not found`, StatusCodes.NOT_FOUND);
  }

  crons[name].start();

  return getCron(name);
};

/**
 * Stop specific cron
 *
 * @param name The cron name
 *
 * @returns The cron info
 */
export const stopCron = (name: string) => {
  if (!isCron(name)) {
    // TODO[refactor]: Not an HTTP Error at this point
    throw new HTTPError(`Cron "${name}" not found`, StatusCodes.NOT_FOUND);
  }

  crons[name].stop();

  return getCron(name);
};
