import { formatISO, parseISO } from 'date-fns';

import { client } from '~/lib/fetch';
import type { ApiResponse } from '~/lib/api';

import type { RawReportPeriod, ReportPeriod } from '~/modules/reports/types';
import { transformPeriod } from '~/modules/reports/methods';

import { Recurrence } from './types';

/**
 * Get the period covered by a recurrence
 *
 * @param recurrence The recurrence
 * @param reference The date used as reference, defaults to today
 * @param offset The offset, negative for previous, positive for next, 0 for current, default to 0
 *
 * @returns The period covered by the recurrence
 */
export async function getPeriodFromRecurrence(
  recurrence: Recurrence,
  reference?: Date,
  offset?: number,
): Promise<ReportPeriod> {
  const {
    content,
  } = await client.fetch<ApiResponse<RawReportPeriod>>(`/recurrence/${recurrence}/period`, {
    params: {
      reference: reference && formatISO(reference),
      offset,
    },
  });

  return transformPeriod(content);
}

/**
 * Get the "nextDate" (next iteration of a report) from a recurrence and a reference
 *
 * @param recurrence The recurrence
 * @param reference The date used as reference, defaults to today
 *
 * @returns The next iteration date
 */
export async function getNextDateFromRecurrence(
  recurrence: Recurrence,
  reference?: Date,
): Promise<Date> {
  const {
    content,
  } = await client.fetch<ApiResponse<{ value: string }>>(`/recurrence/${recurrence}/nextDate`, {
    params: {
      reference: reference && formatISO(reference),
    },
  });

  return parseISO(content.value);
}
