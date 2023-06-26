import type { estypes as ElasticTypes } from '@elastic/elasticsearch';
import Joi from 'joi';
import { cloneDeep, merge } from 'lodash';
import EventEmitter from 'node:events';
import { Recurrence, type Prisma } from '~/lib/prisma';
import { formatISO } from '~/lib/date-fns';
import { elasticCount, elasticSearch } from '~/lib/elastic';
import { calcElasticInterval } from '~/models/recurrence';
import { ArgumentError } from '~/types/errors';

type ElasticFilters = ElasticTypes.QueryDslQueryContainer;
type ElasticAggregation = ElasticTypes.AggregationsAggregationContainer;
type CustomAggregation = (
  Omit<ElasticAggregation, 'aggregations' | 'aggs'>
  & { name?: string, aggregations?: CustomAggregation[], aggs?: CustomAggregation[] }
);

interface FetchOptions {
  // Auto fields
  recurrence: Recurrence,
  period: Interval,
  // Namespace specific
  auth: { username: string },
  // Template specific
  dateField: string,
  /**
   * @deprecated Not used anymore
  */
  indexPrefix?: string,
  // Task specific
  /**
   * @deprecated Replaced by `index`
  */
  indexSuffix?: string,
  index?: string,
  filters?: ElasticFilters,
  aggs?: CustomAggregation[],
  fetchCount?: string,
}

const optionSchema = Joi.object<FetchOptions>({
  // Auto fields
  recurrence: Joi.string().valid(
    Recurrence.DAILY,
    Recurrence.WEEKLY,
    Recurrence.MONTHLY,
    Recurrence.QUARTERLY,
    Recurrence.BIENNIAL,
    Recurrence.YEARLY,
  ).required(),
  period: Joi.object({
    start: Joi.date().required(),
    end: Joi.date().required(),
  }).required(),
  // Namespace specific
  auth: Joi.object({
    username: Joi.string().required(),
  }).required(),
  indexPrefix: Joi.string().allow(''), // @deprecated Use `index` instead
  // Task specific
  indexSuffix: Joi.string().allow(''), // @deprecated Use `index` instead
  index: Joi.string().allow(''),
  filters: Joi.object(),
  aggs: Joi.array(),
  fetchCount: Joi.string(),
  dateField: Joi.string().required(),
});

/**
 * Check if input data is fetch options
 *
 * @param data The input data
 * @returns `true` if valid
 *
 * @throws If not valid
 */
const isFetchOptions = (data: unknown): data is FetchOptions => {
  const validation = optionSchema.validate(data, {});
  if (validation.error != null) {
    throw new ArgumentError(`Fetch options are not valid: ${validation.error.message}`);
  }
  return true;
};

type AggInfo = {
  name: string,
  subAggs: AggInfo[],
};

/**
 * Parse aggregations in order to calculate keys when cleaning elastic response
 *
 * @param agg The aggregation
 * @param i The index, used to generate default name
 *
 * @returns The info about aggregation
 */
const parseAggInfo = (agg: CustomAggregation, i: number): AggInfo => {
  const name = agg.name || `agg${i}`;

  let subAggs: AggInfo[] = [];
  if (agg.aggs || agg.aggregations) {
    const key = agg.aggs ? 'aggs' : 'aggregations';
    subAggs = agg[key]?.map(parseAggInfo) ?? [];
  }

  return {
    name,
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
  { name: _name, ...rawAgg }: CustomAggregation,
  calendar_interval: string,
  aggsInfo: AggInfo,
) => {
  let agg = rawAgg;
  // Add default calendar_interval
  if (rawAgg.date_histogram) {
    agg = merge(agg, { date_histogram: { calendar_interval } });
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
    [aggsInfo.name]: agg as ElasticAggregation,
  };
};

/**
 * Cleans aggregation results from elastic
 *
 * @param info Info about aggregation
 * @param value Value of the sub aggregation. WILL BE MODIFIED.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setSubAggValues = (info: AggInfo, value: any) => {
  const data = value[info.name];

  if (info.subAggs.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const subAgg of info.subAggs) {
      setSubAggValues(subAgg, data);
    }
  } else {
    const hits = data?.hits?.hits ?? [];
    // eslint-disable-next-line no-param-reassign, @typescript-eslint/no-explicit-any
    value[info.name] = hits.map(({ _source }: any) => _source);
  }
};

/**
 * Fetch data from elastic
 *
 * @param options Params
 * @param _events Event Emitter
 *
 * @returns The data fetched and cleaned
 */
export default async (
  options: Record<string, unknown> | FetchOptions,
  _events: EventEmitter = new EventEmitter(),
) => {
  // Check options even if type is explicit, because it can be a merge between multiple sources
  if (!isFetchOptions(options)) {
    // As validation throws an error, this line shouldn't be called
    return [];
  }
  const index = (options.index ?? `${options.indexPrefix}${options.indexSuffix}`) || null;
  if (!index) {
    throw new ArgumentError('You must precise an index before trying to fetch data from elastic');
  }

  const baseOpts: ElasticTypes.SearchRequest = {
    index,
    body: {
      query: {
        bool: {
          ...(options.filters ?? {}),
          filter: {
            range: {
              [options.dateField]: {
                gte: formatISO(options.period.start),
                lte: formatISO(options.period.end),
              },
            },
          },
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

  const data: Prisma.JsonValue = {};
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
    for (const { name, subAggs } of aggsInfos) {
      if (!body.aggregations?.[name]) {
        throw new Error(`Aggregation "${name}" not found`);
      }
      const aggRes = body.aggregations[name];

      if ('buckets' in aggRes) {
        // Transform object data into arrays
        if (
          typeof aggRes.buckets === 'object'
          && !Array.isArray(aggRes.buckets)
        ) {
          aggRes.buckets = Object.entries(aggRes.buckets).map(
            ([key, value]) => ({ value, key }),
          );
        }

        // Simplify access to sub-aggregations' result
        if (subAggs.length > 0) {
          // eslint-disable-next-line no-restricted-syntax
          for (const bucket of aggRes.buckets) {
            // eslint-disable-next-line no-restricted-syntax
            for (const subAgg of subAggs) {
              setSubAggValues(subAgg, bucket);
            }
          }
        }
        data[name] = aggRes.buckets;
      } else {
        data[name] = aggRes as Prisma.JsonObject;
      }
    }
  }

  if (options.fetchCount) {
    const { body: { count } } = await elasticCount(baseOpts, options.auth.username);
    data[options.fetchCount] = count;
  }

  return data;
};
