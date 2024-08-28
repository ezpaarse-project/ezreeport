import type { estypes as ElasticTypes } from '@elastic/elasticsearch';

import { formatISO, type Interval } from '~/lib/date-fns';
import { Type, type Static } from '~/lib/typebox';
import { ensureArray } from '~/lib/utils';

export const Filter = Type.Intersect([
  Type.Object({
    name: Type.String(),
    isNot: Type.Optional(Type.Boolean()),
  }),
  // AND
  Type.Union([
    Type.Object({
      raw: Type.Record(Type.String(), Type.Any()),
    }),
    // OR
    Type.Object({
      field: Type.String(),
      value: Type.Optional(
        Type.Union([
          Type.String(),
          // OR
          Type.Array(Type.String()),
        ]),
      ),
    }),
  ]),
]);

export type FilterType = Static<typeof Filter>;

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
