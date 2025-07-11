import type { estypes as ElasticTypes } from '@elastic/elasticsearch';

import { formatISO, type Interval } from '@ezreeport/dates';
import { ensureArray } from '@ezreeport/models/lib/utils';

import type { FilterType } from '@ezreeport/models/templates';

/**
 * Transform a filter to ElasticSearch's format
 *
 * @param filter The filter
 *
 * @returns Filter in ElasticSearch format
 */
function prepareEsFilter(
  filter: FilterType
): ElasticTypes.QueryDslQueryContainer {
  if ('raw' in filter) {
    return filter.raw;
  }

  if (!filter.value) {
    return { exists: { field: filter.field } };
  }

  return {
    bool: {
      filter: [{ terms: { [filter.field]: ensureArray(filter.value) } }],
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
  period: Interval
): ElasticTypes.QueryDslQueryContainer {
  const must: ElasticTypes.QueryDslQueryContainer[] = [];
  const mustNot: ElasticTypes.QueryDslQueryContainer[] = [];

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
