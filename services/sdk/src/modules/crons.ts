import { parseISO } from 'date-fns';

import axios, { type ApiResponse } from '../lib/axios';

interface RawCron {
  name: string,
  running: boolean,
  nextRun?: string, // Date
  lastRun?: string, // Date
}

export interface Cron extends Omit<RawCron, 'nextRun' | 'lastRun'> {
  nextRun?: Date,
  lastRun?: Date,
}

export interface InputCron extends Pick<Cron, 'running'> {}

/**
 * Transform raw data from JSON, to JS usable data
 *
 * @param cron Raw cron
 *
 * @returns Parsed cron
 */
const parseCron = (cron: RawCron): Cron => ({
  ...cron,
  nextRun: cron.nextRun ? parseISO(cron.nextRun) : undefined,
  lastRun: cron.lastRun ? parseISO(cron.lastRun) : undefined,
});

/**
 * Get all available crons
 *
 * Needs `general.crons-get` permission
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
 * Needs `general.crons-get-cron` permission
 *
 * @param cronOrName Cron or Cron name
 *
 * @returns Cron's info
 */
export const getCron = async (cronOrName: Cron | Cron['name']): Promise<ApiResponse<Cron>> => {
  const name = typeof cronOrName === 'string' ? cronOrName : cronOrName.name;
  const { content, ...response } = await axios.$get<RawCron>(`/crons/${name}`);
  return {
    ...response,
    content: parseCron(content),
  };
};

/**
 * Start cron
 *
 * Needs `general.crons-put-cron-start` permission
 *
 * @param cronOrName Cron or Cron name
 *
 * @deprecated Use `updateCron` with body `{ running: true }`
 *
 * @returns Cron's info
 */
export const startCron = async (cronOrName: Cron | Cron['name']) => {
  const name = typeof cronOrName === 'string' ? cronOrName : cronOrName.name;
  const { content, ...response } = await axios.$put<RawCron>(`/crons/${name}/start`, {});
  return {
    ...response,
    content: parseCron(content),
  };
};

/**
 * Stop cron
 *
 * Needs `general.crons-put-cron-stop` permission
 *
 * @param cronOrName Cron or Cron name
 *
 * @deprecated Use `updateCron` with body `{ running: false }`
 *
 * @returns Cron's info
 */
export const stopCron = async (cronOrName: Cron | Cron['name']) => {
  const name = typeof cronOrName === 'string' ? cronOrName : cronOrName.name;
  const { content, ...response } = await axios.$put<RawCron>(`/crons/${name}/stop`, {});
  return {
    ...response,
    content: parseCron(content),
  };
};

/**
 * Update cron
 *
 * Needs `general.crons-patch-cron` permission
 *
 * @param cronOrName Cron or Cron name
 *
 * @returns Cron's info
 */
export const updateCron = async (cron: Partial<InputCron> & { name: Cron['name'] }) => {
  const { name, ...data } = cron;
  const { content, ...response } = await axios.$patch<RawCron>(`/crons/${name}`, data);
  return {
    ...response,
    content: parseCron(content),
  };
};

/**
 * Force cron to run
 *
 * Needs `general.crons-post-cron-force` permission
 *
 * @param cronOrName Cron or Cron name
 *
 * @returns Cron's info
 */
export const forceCron = async (cronOrName: Cron | Cron['name']) => {
  const name = typeof cronOrName === 'string' ? cronOrName : cronOrName.name;
  const { content, ...response } = await axios.$post<RawCron>(`/crons/${name}/_force`, {});
  return {
    ...response,
    content: parseCron(content),
  };
};
