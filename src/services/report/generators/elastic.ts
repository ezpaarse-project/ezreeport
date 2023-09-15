import EventEmitter from 'node:events';

import type { estypes as ElasticTypes } from '@elastic/elasticsearch';
import { cloneDeep, merge } from 'lodash';

import { Recurrence, type Prisma } from '~/lib/prisma';
import { formatISO } from '~/lib/date-fns';
import { elasticCount, elasticSearch } from '~/lib/elastic';
import { Type, type Static, assertIsSchema } from '~/lib/typebox';

import { calcElasticInterval } from '~/models/recurrence';
import { ArgumentError } from '~/types/errors';

type ElasticAggregation = ElasticTypes.AggregationsAggregationContainer;

const CustomAggregation = Type.Recursive(
  (This) => Type.Intersect([
    // Simplification of ElasticAggregation
    Type.Record(Type.String(), Type.Any()),

    Type.Partial(
      Type.Object({
        name: Type.String({ minLength: 1 }),
        aggregations: Type.Array(This),
        aggs: Type.Array(This),
      }),
    ),
  ]),
);

type CustomAggregationType = Static<typeof CustomAggregation>;

const ElasticFetchOptions = Type.Object({
  // Auto fields
  recurrence: Type.Enum(Recurrence),
  period: Type.Object({
    start: Type.Integer(),
    end: Type.Integer(),
  }),
  // Namespace specific
  auth: Type.Object({
    username: Type.String({ minLength: 1 }),
  }),
  // Template specific
  dateField: Type.String({ minLength: 1 }),
  // Task specific
  index: Type.String({ minLength: 1 }),
  filters: Type.Optional(
    // Simplification of Elastic's filters
    Type.Record(Type.String(), Type.Any()),
  ),
  aggs: Type.Optional(
    Type.Array(CustomAggregation),
  ),
  fetchCount: Type.Optional(
    Type.String({ minLength: 1 }),
  ),
});

export type ElasticFetchOptionsType = Static<typeof ElasticFetchOptions>;

type AggInfo = {
  name: string,
  type: string,
  subAggs: AggInfo[],
};

const handledKeys = new Set(['name', 'aggs', 'aggregations']);
/**
 * Parse aggregations in order to calculate keys when cleaning elastic response
 *
 * @param agg The aggregation
 * @param i The index, used to generate default name
 *
 * @returns The info about aggregation
 */
const parseAggInfo = (agg: CustomAggregationType, i: number): AggInfo => {
  const name = agg.name || `agg${i}`;

  let subAggs: AggInfo[] = [];
  if (agg.aggs || agg.aggregations) {
    const key = agg.aggs ? 'aggs' : 'aggregations';
    subAggs = agg[key]?.map(parseAggInfo) ?? [];
  }

  return {
    name,
    type: Object.keys(agg).filter((k) => !handledKeys.has(k))[0],
    subAggs,
  };
};

/**
 * Transforms custom aggregation format into elastic one
 *
 * @param prev The previous aggregations
 * @param param1 The aggregation
 * @param calendar_interval The calendar interval guessed from task's recurrence
 * @param aggsInfo Info about agg
 *
 * @returns The elastic aggregations
 */
const reduceAggs = (
  prev: Record<string, ElasticAggregation>,
  { name: _name, ...rawAgg }: CustomAggregationType,
  calendar_interval: string,
  aggsInfo: AggInfo,
) => {
  let agg = rawAgg;
  // Add calendar_interval
  if (rawAgg.date_histogram) {
    agg = merge({}, agg, { date_histogram: { calendar_interval } });
  }
  // Add default missing value
  if (rawAgg.terms) {
    agg = merge({}, { terms: { missing: 'Non renseigné' } }, agg);
  }

  // Handle sub aggregations
  if (rawAgg.aggs || rawAgg.aggregations) {
    const key = rawAgg.aggs ? 'aggs' : 'aggregations';
    agg[key] = rawAgg[key]?.reduce(
      (subPrev, subAgg, i) => reduceAggs(subPrev, subAgg, calendar_interval, aggsInfo.subAggs[i]),
      {} as Record<string, ElasticAggregation>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any;
  }

  return {
    ...prev,
    [aggsInfo.name]: agg,
  };
};

/**
 * Cleans aggregation results from elastic
 *
 * @param info Info about aggregation
 * @param aggs Value of the sub aggregation.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cleanAggValues = (info: AggInfo, aggs: any): any[] => {
  const data = aggs[info.name];

  // If agg is a simple value
  if ('value' in data) {
    // eslint-disable-next-line no-param-reassign
    return data.value;
  }

  // If agg is a plain hit
  if ('hits' in data) {
    const hits = data.hits?.hits ?? [];
    // eslint-disable-next-line no-param-reassign, @typescript-eslint/no-explicit-any
    return hits.map(({ _source }: any) => _source);
  }

  // If agg is a bucket of other aggregations
  if ('buckets' in data) {
    // eslint-disable-next-line no-param-reassign
    const { buckets } = data;

    // eslint-disable-next-line no-restricted-syntax
    for (const subAgg of info.subAggs) {
      for (let i = 0; i < buckets.length; i += 1) {
        buckets[i] = cleanAggValues(subAgg, buckets[i]);
      }
    }

    return buckets;
  }

  return data;
};

/**
 * Fetch data from elastic
 *
 * @param options Params
 * @param _events Event Emitter
 *
 * @returns The data fetched and cleaned
 */
const fetchWithElastic = async (
  options: Record<string, unknown> | ElasticFetchOptionsType,
  _events: EventEmitter = new EventEmitter(),
) => {
  // Check options even if type is explicit, because it can be a merge between multiple sources
  assertIsSchema(ElasticFetchOptions, options);

  const index = options.index || null;
  if (!index) {
    throw new ArgumentError('You must precise an index before trying to fetch data from elastic');
  }

  const { filter, ...otherFilters } = (options.filters ?? { filter: [] });
  const baseOpts: ElasticTypes.SearchRequest = {
    index,
    body: {
      query: {
        bool: {
          ...otherFilters,
          filter: [
            {
              range: {
                [options.dateField]: {
                  gte: formatISO(options.period.start),
                  lte: formatISO(options.period.end),
                  format: 'strict_date_optional_time',
                },
              },
            },
            ...filter,
          ],
        },
      },
    },
  };
  const opts = cloneDeep(baseOpts);

  // Generating names for aggregations if not defined
  const aggsInfos = options.aggs?.map(parseAggInfo) ?? [];

  // Always true but TypeScript refers to ElasticTypes instead...
  if (opts.body) {
    if (options.aggs) {
      const calendarInterval = calcElasticInterval(options.recurrence);
      opts.size = 1; // keeping at least one record so we can check if there's data or not
      opts.body.aggs = options.aggs.reduce(
        (prev, agg, i) => reduceAggs(prev, agg, calendarInterval, aggsInfos[i]),
        {} as Record<string, ElasticAggregation>,
      );
    }
  }

  let data: Prisma.JsonValue = {};
  const { body } = await elasticSearch(opts, options.auth.username);

  // Checks any errors
  if (body._shards.failures?.length) {
    const reasons = body._shards.failures.map((err) => err.reason.reason).join(' ; ');
    throw new Error(`An error occurred when fetching data : ${reasons}`);
  }

  // Checks if there's data
  if (
    typeof body.hits.total === 'object'
      ? body.hits.total.value === 0
      : body.hits.hits.length === 0
  ) {
    throw new Error(`No data found for given request: ${JSON.stringify(opts)}`);
  }

  if (options.aggs) {
    // eslint-disable-next-line no-restricted-syntax
    for (const aggInfo of aggsInfos) {
      data = cleanAggValues(aggInfo, body.aggregations);
    }
  }

  if (options.fetchCount) {
    const { body: { count } } = await elasticCount(baseOpts, options.auth.username);
    data[options.fetchCount] = count;
  }

  return data;
};

export default fetchWithElastic;
