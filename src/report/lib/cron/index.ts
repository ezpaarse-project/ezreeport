import Cron from 'bull';
import { join } from 'node:path';
import { NotFoundError } from '../../types/errors';
import config from '../config';
import logger from '../logger';

const { concurrence, ...redis } = config.get('redis');

const dailyCron = new Cron<null>('daily cron', { prefix: 'cron', redis });
dailyCron.on('failed', (job, err) => {
  if (job.attemptsMade === job.opts.attempts) {
    logger.error(`[cron] "daily" failed with error: ${err.message}`);
  }
});
dailyCron.clean(0, 'delayed').then(() => {
  // Cleaning next jobs before adding cron to avoid issues
  dailyCron.add(null, { repeat: { cron: process.env.NODE_ENV === 'production' ? '0 0 * * *' : '* * * * *' } });
});
dailyCron.process(concurrence, join(__dirname, 'jobs/daily/index.ts'));

const crons = {
  daily: dailyCron,
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
export const getCron = async (name: string) => {
  if (!isCron(name)) {
    throw new NotFoundError(`Cron "${name}" not found`);
  }
  const cron = crons[name];

  const lastCompletedJob = (await cron.getJobs(['active', 'completed', 'failed', 'paused']))[0];
  let lastRun: Date | undefined;
  if (lastCompletedJob && lastCompletedJob.processedOn) {
    lastRun = new Date(lastCompletedJob.processedOn);
  }

  console.log((await cron.getNextJob()));
  console.log((await cron.getJobs(['delayed', 'waiting'])).length);

  const nextDelayedJob = (await cron.getJobs(['delayed', 'waiting']))[0];
  let nextRun: Date | undefined;
  if (nextDelayedJob && nextDelayedJob.opts.delay) {
    nextRun = new Date(nextDelayedJob.timestamp + nextDelayedJob.opts.delay);
  }

  return {
    name,
    running: !(await cron.isPaused()),
    lastRun,
    nextRun,
  };
};

// TODO[feat]: Paginate
// TODO[feat]: Filter
/**
 * Get all crons
 *
 * @returns The crons info
 */
export const getAllCrons = () => Promise.all(Object.keys(crons).map((name) => getCron(name)));

/**
 * Start specific cron
 *
 * @param name The cron name
 *
 * @returns The cron info
 */
export const startCron = async (name: string) => {
  if (!isCron(name)) {
    throw new NotFoundError(`Cron "${name}" not found`);
  }

  await crons[name].resume();

  return getCron(name);
};

/**
 * Stop specific cron
 *
 * @param name The cron name
 *
 * @returns The cron info
 */
export const stopCron = async (name: string) => {
  if (!isCron(name)) {
    throw new NotFoundError(`Cron "${name}" not found`);
  }

  await crons[name].pause();

  return getCron(name);
};
