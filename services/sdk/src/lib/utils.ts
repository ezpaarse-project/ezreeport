import { parseISO } from 'date-fns';

export interface RawPeriod {
  start: string;
  end: string;
}

export interface Period extends Omit<RawPeriod, 'start' | 'end'> {
  start: Date;
  end: Date;
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
