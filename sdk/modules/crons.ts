import axios from '../lib/axios';

interface Cron {
  name: string,
  running: boolean,
  nextRun: string, // Date
  lastRun?: string, // Date
}

/**
 * Get all available crons
 *
 * Needs `crons-get` permission
 *
 * @returns All crons' info
 */
export const getAllCrons = () => axios.$get<Cron>('/crons');

/**
 * Get cron info
 *
 * Needs `crons-get-cron` permission
 *
 * @param name Cron name
 *
 * @returns Cron's info
 */
export const getCron = (name: string) => axios.$get<Cron>(`/crons/${name}`);

/**
 * Start cron
 *
 * Needs `crons-put-cron-start` permission
 *
 * @param name Cron name
 *
 * @returns Cron's info
 */
export const startCron = (name: string) => axios.$put<Cron>(`/crons/${name}/start`);

/**
 * Stop cron
 *
 * Needs `crons-put-cron-stop` permission
 *
 * @param name Cron name
 *
 * @returns Cron's info
 */
export const stopCron = (name: string) => axios.$put<Cron>(`/crons/${name}/stop`);

/**
 * Force cron to run
 *
 * Needs `crons-post-cron-force` permission
 *
 * @param name Cron name
 *
 * @returns Cron's info
 */
export const forceCron = (name: string) => axios.$post<Cron>(`/crons/${name}/force`);
