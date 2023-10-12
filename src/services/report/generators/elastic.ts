import EventEmitter from 'node:events';

import type { estypes as ElasticTypes, RequestParams } from '@elastic/elasticsearch';
import { merge } from 'lodash';

import { Recurrence, type Prisma } from '~/lib/prisma';
import { formatISO } from '~/lib/date-fns';
import { elasticCount, elasticMSearch } from '~/lib/elastic';
import { Type, type Static, assertIsSchema } from '~/lib/typebox';

import { calcElasticInterval } from '~/models/recurrence';
import { ArgumentError } from '~/types/errors';

import aggsTypes from './elastic/aggs.json';

type ElasticAggregation = ElasticTypes.AggregationsAggregationContainer;

/**
 * All types of bucket aggregations in elastic
 */
const bucketAggregations = new Set<string>(
  Object.entries(aggsTypes)
    .filter(([, { returnsArray }]) => returnsArray)
    .map(([key]) => key),
);

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

// FIXME: temporary fix while recursive type are wrongly implemented in TypeBox
const Bucket = Type.Intersect([
  // Simplification of ElasticAggregation
  Type.Record(Type.String(), Type.Any()),

  Type.Partial(
    Type.Object({
      name: Type.String({ minLength: 1 }),
    }),
  ),
]);

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
  // Figure specific
  requests: Type.Array(
    Type.Intersect([
      Type.Union([
        Type.Object({
          buckets: Type.Optional(
            Type.Array(Bucket),
          ),
          metric: Type.Optional(Bucket),
        }),
        // OR
        Type.Object({
          aggs: Type.Optional(
            Type.Array(Bucket),
          ),
        }),
      ]),
      // AND
      Type.Object({
        fetchCount: Type.Optional(
          Type.String({ minLength: 1 }),
        ),
        // Merged
        filters: Type.Optional(
          // Simplification of Elastic's filters
          Type.Record(Type.String(), Type.Any()),
        ),
      }),
    ]),
  ),
});

export type ElasticFetchOptionsType = Static<typeof ElasticFetchOptions>;

type AggInfo = {
  name: string,
  type: string,
  subAggs: AggInfo[],
};

const handledKeys = new Set(['name', 'aggs', 'aggregations']);

const getAggType = (agg: Record<string, any>) => Object.keys(agg)
  .filter((k) => !handledKeys.has(k))[0];

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
    type: getAggType(agg),
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
 * @param dateField The current date field
 *
 * @returns The elastic aggregations
 */
const reduceAggs = (
  prev: Record<string, ElasticAggregation>,
  { name: _name, ...rawAgg }: CustomAggregationType,
  calendar_interval: string,
  aggsInfo: AggInfo,
  dateField: string,
): Record<string, ElasticAggregation> => {
  const agg = rawAgg as ElasticAggregation;
  // Add calendar_interval
  if (rawAgg.date_histogram) {
    merge(agg, { date_histogram: { calendar_interval } });
  }
  // Replace `{{ dateField }}` by actual dateField
  if (/{{ ?dateField ?}}/.test(rawAgg[aggsInfo.type].field)) {
    merge(agg, { [aggsInfo.type]: { field: dateField } });
  }

  // Handle sub aggregations
  if (rawAgg.aggs || rawAgg.aggregations) {
    const key = rawAgg.aggs ? 'aggs' : 'aggregations';
    agg[key] = rawAgg[key]?.reduce(
      (subPrev, subAgg, i) => reduceAggs(
        subPrev,
        subAgg,
        calendar_interval,
        aggsInfo.subAggs[i],
        dateField,
      ),
      {},
    );
  }

  return {
    ...prev,
    [aggsInfo.name]: agg,
  };
};

/**
 * Cleans aggregation results from elastic and flattens the result
 *
 * @param info Info about aggregation
 * @param aggs Value of the sub aggregation.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cleanAggValues = (info: AggInfo, aggs: any): any[] => {
  const aggValue = aggs[info.name];
  let buckets = 'buckets' in aggValue ? aggValue.buckets : [aggValue];

  const data = [];

  // If bucket are still an object, tries to map it as an array
  if (typeof buckets === 'object' && !Array.isArray(buckets)) {
    buckets = Object.entries(buckets)
      .map(([key, value]) => ({ key, value }));
  }

  // If no sub-agg, no further treatment is needed
  if (info.subAggs.length <= 0) {
    return buckets;
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const bucket of buckets) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subBuckets = new Map<string, any[]>();

    // Cleaning values
    // eslint-disable-next-line no-restricted-syntax
    for (const subAgg of info.subAggs) {
      subBuckets.set(subAgg.name, cleanAggValues(subAgg, bucket));
    }

    // Getting combinations of all subArgs within bucket
    const subBucketEntries = Array.from(subBuckets.entries());
    const bucketCombinations = subBucketEntries.reduce(
      (combinationsSoFar, [aggName, sb]) => {
        // If no value in bucket
        if (sb.length === 0) { return combinationsSoFar; }

        // Merge previous results with new one
        return sb.flatMap((b) => {
          if (combinationsSoFar.length === 0) {
            return { [aggName]: b };
          }

          return combinationsSoFar.map((c) => ({ ...c, [aggName]: b }));
        });
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [] as any[],
    );

    // Merging current bucket value with cleaned + combinations
    data.push(
      ...bucketCombinations.map(
        (b) => ({
          ...bucket,
          ...b,
        }),
      ),
    );
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
  assertIsSchema(ElasticFetchOptions, options, 'fetchOptions');

  const index = options.index || null;
  if (!index) {
    throw new ArgumentError('You must precise an index before trying to fetch data from elastic');
  }

  const allAggsOptions: CustomAggregationType[][] = [];
  const allAggsInfos: AggInfo[][] = [];
  const opts: RequestParams.Msearch<ElasticTypes.MsearchMultisearchBody[]> = {
    index,
    body: options.requests.map((r) => {
      const { filter, ...query } = (r.filters ?? { filter: [] });
      let size: number | undefined;

      let aggsOptions: CustomAggregationType[] | undefined;
      if ('aggs' in r && r.aggs) {
        // If aggs are already provided just take them
        aggsOptions = r.aggs;
      } else if ('buckets' in r && r.buckets) {
        // If aggs need to be merged from buckets and metric
        const recursiveBucket = [...r.buckets]
          .reverse()
          .reduce(
            (prev, { aggregations, aggs, ...v }) => {
              const sub = aggregations || aggs || [];

              if (r.metric) {
                sub.push(r.metric);
              }

              if (prev) {
                sub.push(prev);
              }

              return {
                ...v,
                aggs: sub,
              };
            },
            undefined as CustomAggregationType | undefined,
          );
        if (recursiveBucket) {
          aggsOptions = [recursiveBucket];
        }
      } else if ('metric' in r && r.metric) {
        aggsOptions = [r.metric];
      }
      allAggsOptions.push(aggsOptions ?? []);

      let aggs: Record<string, ElasticAggregation> | undefined;
      const info = aggsOptions?.map(parseAggInfo) ?? [];
      allAggsInfos.push(info);
      if (aggsOptions) {
        const calendarInterval = calcElasticInterval(options.recurrence);
        size = 1;
        aggs = aggsOptions.reduce(
          (prev, agg, i) => reduceAggs(prev, agg, calendarInterval, info[i], options.dateField),
          {},
        );
      }

      return {
        query: {
          bool: {
            ...query,
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
        aggs,
        size,
      };
    }),
  };

  const results: Prisma.JsonObject[] = [];
  const { body: { responses } } = await elasticMSearch(
    {
      ...opts,
      // add empty headers
      body: opts.body.map((v) => [{}, v]).flat(),
    },
    options.auth.username,
  );

  for (let i = 0; i < responses.length; i += 1) {
    const response = responses[i];
    const aggsInfos = allAggsInfos[i];
    const request = options.requests[i];
    const aggs = allAggsOptions[i];
    const data: Prisma.JsonObject = {};

    // Checks any errors
    if ('error' in response) {
      throw new Error(response.error.reason);
    }

    // Checks any errors
    if (response._shards.failures?.length) {
      const reasons = response._shards.failures.map((err) => err.reason.reason).join(' ; ');
      throw new Error(`An error occurred when fetching data : ${reasons}`);
    }

    // Checks if there's data
    if (
      typeof response.hits.total === 'object'
        ? response.hits.total.value === 0
        : response.hits.hits.length === 0
    ) {
      throw new Error(`No data found for given request: ${JSON.stringify(opts.body[i])}`);
    }

    if (aggs.length > 0) {
      // eslint-disable-next-line no-restricted-syntax
      for (const aggInfo of aggsInfos) {
        const cleaned = cleanAggValues(aggInfo, response.aggregations);

        // Remove redundant arrays
        let values = cleaned;
        // Don't transform aggregations that are expected to returns array
        if (!bucketAggregations.has(aggInfo.type) && cleaned.length === 1) {
          ([values] = cleaned);
        }
        data[aggInfo.name] = values;
      }
    }

    if (request.fetchCount) {
      // eslint-disable-next-line no-await-in-loop
      const { body: { count } } = await elasticCount(
        { body: { query: opts.body[i].query } },
        options.auth.username,
      );
      data[request.fetchCount] = count;
    }

    results.push(data);
  }

  return results;
};

export default fetchWithElastic;
