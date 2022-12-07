import { parseISO } from 'date-fns';
import axios, { type ApiResponse } from '../lib/axios';

interface RawCron {
  name: string,
  running: boolean,
  nextRun: string, // Date
  lastRun?: string, // Date
}

export interface Cron extends Omit<RawCron, 'nextRun' | 'lastRun'> {
  nextRun: Date,
  lastRun?: Date,
}

/**
 * Transform raw data from JSON, to JS usable data
 *
 * @param cron Raw cron
 *
 * @returns Parsed cron
 */
const parseCron = (cron: RawCron): Cron => ({
  ...cron,
  nextRun: parseISO(cron.nextRun),
  lastRun: cron.lastRun ? parseISO(cron.lastRun) : undefined,
});

/**
 * Get all available crons
 *
 * Needs `crons-get` permission
 *
 * @returns All crons' info
 */
export const getAllCrons = async (): Promise<ApiResponse<Cron[]>> => {
  const { content, ...response } = await axios.$get<RawCron[]>('/crons');
  return {
    ...response,
    content: content.map(parseCron),
  };
};

/**
 * Get cron info
 *
 * Needs `crons-get-cron` permission
 *
 * @param name Cron name
 *
 * @returns Cron's info
 */
export const getCron = async (name: Cron['name']): Promise<ApiResponse<Cron>> => {
  const { content, ...response } = await axios.$get<RawCron>(`/crons/${name}`);
  return {
    ...response,
    content: parseCron(content),
  };
};

/**
 * Start cron
 *
 * Needs `crons-put-cron-start` permission
 *
 * @param name Cron name
 *
 * @returns Cron's info
 */
export const startCron = async (name: Cron['name']) => {
  const { content, ...response } = await axios.$put<RawCron>(`/crons/${name}/start`);
  return {
    ...response,
    content: parseCron(content),
  };
};

/**
 * Stop cron
 *
 * Needs `crons-put-cron-stop` permission
 *
 * @param name Cron name
 *
 * @returns Cron's info
 */
export const stopCron = async (name: Cron['name']) => {
  const { content, ...response } = await axios.$put<RawCron>(`/crons/${name}/stop`);
  return {
    ...response,
    content: parseCron(content),
  };
};

/**
 * Force cron to run
 *
 * Needs `crons-post-cron-force` permission
 *
 * @param name Cron name
 *
 * @returns Cron's info
 */
export const forceCron = async (name: Cron['name']) => {
  const { content, ...response } = await axios.$post<RawCron>(`/crons/${name}/force`);
  return {
    ...response,
    content: parseCron(content),
  };
};
