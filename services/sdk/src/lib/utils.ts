import { parseISO } from 'date-fns';

/**
 * Async version of `setTimeout`
 *
 * @param ms Time to wait
 */
export const setTimeoutAsync = (ms: number) => new Promise(
  (resolve) => { setTimeout(resolve, ms); },
);

export interface RawPeriod {
  start: string,
  end: string,
}

export interface Period extends Omit<RawPeriod, 'start' | 'end'> {
  start: Date,
  end: Date,
}

/**
 * Transform raw data from JSON, to JS usable data
 *
 * @param period Raw period
 *
 * @returns Parsed period
 */
export const parsePeriod = (period: RawPeriod): Period => ({
  start: parseISO(period.start),
  end: parseISO(period.end),
});

export type PaginationOpts = { previous?: string, count?: number, sort?: string };
