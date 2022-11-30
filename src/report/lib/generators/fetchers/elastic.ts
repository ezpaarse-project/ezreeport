import type { estypes as ElasticTypes } from '@elastic/elasticsearch';
import { Recurrence, type Prisma } from '@prisma/client';
import { formatISO } from 'date-fns';
import Joi from 'joi';
import { cloneDeep } from 'lodash';
import EventEmitter from 'node:events';
import { ArgumentError } from '../../../types/errors';
import { elasticCount, elasticSearch } from '../../elastic';
import { calcElasticInterval } from '../../recurrence';

type ElasticFilters = ElasticTypes.QueryDslQueryContainer;
type ElasticAggregation = ElasticTypes.AggregationsAggregationContainer;

interface FetchOptions {
  recurrence: Recurrence,
  period: Interval,
  filters?: ElasticFilters,
  /**
   * Test doc
   */
  indexPrefix: string,
  indexSuffix: string,
  user: string,
  fetchCount?: string,
  aggs?: (ElasticAggregation & { name?: string })[];
}

const optionScehma = Joi.object<FetchOptions>({
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
  filters: Joi.object(),
  indexPrefix: Joi.string().required(),
  indexSuffix: Joi.string().required(),
  user: Joi.string().required(),
  fetchCount: Joi.string(),
  aggs: Joi.array(),
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
  const validation = optionScehma.validate(data, {});
  if (validation.error != null) {
    throw new ArgumentError(`Fetch options are not valid: ${validation.error.message}`);
  }
  return true;
};

export default async (
  options: Record<string, unknown> | FetchOptions,
  _events: EventEmitter = new EventEmitter(),
) => {
  // Check options even if type is explicit, because it can be a merge between multiple sources
  if (!isFetchOptions(options)) {
    // As validation throws an error, this line shouldn't be called
    return [];
  }

  const baseOpts: ElasticTypes.SearchRequest = {
    index: options.indexPrefix + options.indexSuffix,
    body: {
      query: {
        bool: {
          ...(options.filters ?? {}),
          filter: {
            range: {
              datetime: {
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
  const aggsNames = options.aggs?.map(({ name }, i) => name ?? `agg${i}`) ?? [];

  // Always true but TypeScript refers to ElasticTypes instead...
  if (opts.body) {
    if (options.aggs) {
      const calendarInterval = calcElasticInterval(options.recurrence);
      opts.size = 0;
      opts.body.aggs = options.aggs.reduce(
        (prev, { name: _name, ...rawAgg }, i) => {
          let agg = rawAgg;
          if ('date_histogram' in rawAgg) {
            agg = {
              ...agg,
              date_histogram: {
                calendar_interval: calendarInterval,
                ...agg.date_histogram,
              },
            };
          }

          return {
            ...prev,
            [aggsNames[i]]: agg,
          };
        },
        {} as Record<string, ElasticAggregation>,
      );
    }
  }

  const data: Prisma.JsonValue = {};
  const { body } = await elasticSearch(opts, options.user);

  if (options.aggs) {
    // eslint-disable-next-line no-restricted-syntax
    for (const name of aggsNames) {
      if (!body.aggregations || !body.aggregations[name]) {
        throw new Error(`Aggregation "${name}" not found`);
      }
      const aggRes = body.aggregations[name];

      if ('buckets' in aggRes) {
        data[name] = aggRes.buckets;
      } else {
        data[name] = aggRes as Prisma.JsonObject;
      }
    }
  }

  if (options.fetchCount) {
    const { body: { count } } = await elasticCount(baseOpts, options.user);
    // eslint-disable-next-line no-underscore-dangle
    data[options.fetchCount] = count;
  }

  return data;
};
