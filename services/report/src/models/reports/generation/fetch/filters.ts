import type { estypes as ElasticTypes } from '@elastic/elasticsearch';

import { z } from '~/lib/zod';
import { formatISO, type Interval } from '~/lib/date-fns';
import { ensureArray } from '~/lib/utils';

export const BaseFilter = z.object({
  field: z.string().min(1)
    .describe('Field to apply filter to'),

  value: z.string().min(1)
    .or(z.array(z.string()).min(1))
    .optional()
    .describe('Value to match, if an array is set data must match one of the values, if not set field must exist'),
});

export const RawFilter = z.object({
  raw: z.record(z.record(z.string(), z.any()))
    .describe('DSL query to run'),
});

export const Filter = z.object({
  name: z.string().min(1)
    .describe('Filter name'),

  isNot: z.boolean().optional()
    .describe('Should invert filter'),
}).and(
  BaseFilter.or(RawFilter),
);

export type FilterType = z.infer<typeof Filter>;

/**
 * Transform a filter to ElasticSearch's format
 *
 * @param filter The filter
 *
 * @returns Filter in ElasticSearch format
 */
function prepareEsFilter(filter: FilterType): ElasticTypes.QueryDslQueryContainer {
  if ('raw' in filter) {
    return filter.raw;
  }

  if (!filter.value) {
    return { exists: { field: filter.field } };
  }

  const value = ensureArray(filter.value);
  if (value.length === 1) {
    return { match_phrase: { [filter.field]: value[0] } };
  }

  return {
    bool: {
      should: value.map(
        (v) => ({ match_phrase: { [filter.field]: v } }),
      ),
    },
  };
}

/**
 * Prepare ElasticSearch query (filters)
 *
 * @param filters The filters to apply
 * @param dateField The date field of the ES index
 * @param period The period of the report
 *
 * @returns ElasticSearch query
 */
export function prepareEsQuery(
  filters: FilterType[],
  dateField: string,
  period: Interval,
): ElasticTypes.QueryDslQueryContainer {
  const must: ElasticTypes.QueryDslQueryContainer[] = [];
  const mustNot: ElasticTypes.QueryDslQueryContainer[] = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const filter of filters) {
    const item = prepareEsFilter(filter);
    if (filter.isNot) {
      mustNot.push(item);
    } else {
      must.push(item);
    }
  }

  // Add date filter
  must.push({
    range: {
      [dateField]: {
        gte: formatISO(period.start),
        lte: formatISO(period.end),
        format: 'strict_date_optional_time',
      },
    },
  });

  return {
    bool: {
      filter: must,
      must_not: mustNot,
    },
  };
}
