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
 * @param period.value The period of the report
 * @param period.dateField The date field of the ES index
 *
 * @returns ElasticSearch query
 */
export function prepareEsQuery(
  filters: FilterType[],
  period?: { value: Interval; dateField: string }
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
  if (period) {
    must.push({
      range: {
        [period.dateField]: {
          gte: formatISO(period.value.start),
          lte: formatISO(period.value.end),
          format: 'strict_date_optional_time',
        },
      },
    });
  }

  return {
    bool: {
      filter: must,
      must_not: mustNot,
    },
  };
}
