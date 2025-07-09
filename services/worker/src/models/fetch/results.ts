import type { estypes as ElasticTypes } from '@elastic/elasticsearch';

import { ensureInt } from '@ezreeport/models/lib/utils';

import type { FigureType } from '@ezreeport/models/templates';

import FetchError from './errors';

export type FetchResultValue = string | number | boolean;

type EsResponse = ElasticTypes.MsearchResponseItem<Record<string, unknown>>;
type EsAggregationResult = Record<string, ElasticTypes.AggregationsAggregate>;
type EsBucket = { key: FetchResultValue, [x: string]: unknown };

/**
 * Item of data fetched
 */
export type FetchResultItem = {
  key: FetchResultValue,
  keyAsString?: string,
  value: FetchResultValue,
  valueAsString?: string,
  [x: string]: FetchResultValue | undefined,
};

/**
 * Asserts that the ES response contains no errors, and have actual usable data
 *
 * @param response The raw ES repsponse
 */
function checkEsErrors(
  response: EsResponse,
): asserts response is ElasticTypes.MsearchMultiSearchItem<Record<string, unknown>> {
  // Checks any errors
  if ('error' in response) {
    const reason = response.error.failed_shards?.[0]?.reason?.reason || response.error.reason;
    throw new FetchError(reason, 'ElasticError');
  }

  // Checks any shard errors
  if (response._shards.failures?.length) {
    const reasons = response._shards.failures.map((err) => err.reason.reason).join(' ; ');
    throw new FetchError(
      `An error occurred when fetching data : ${reasons}`,
      'ShardError',
    );
  }

  // Checks if there's data
  if (
    response.hits.total
    && typeof response.hits.total === 'object'
      ? response.hits.total.value === 0
      : response.hits.total === 0
  ) {
    throw new FetchError('No data found for given request.', 'NoDataError');
  }

  // Check if there's aggregations
  if (!('aggregations' in response) || !response.aggregations) {
    throw new FetchError('No aggregations in response', 'NoDataError');
  }
}

/**
 * Ensure that buckets are an array
 *
 * @param buckets ES buckets
 *
 * @returns Array of ES buckets
 */
function ensureEsBuckets(buckets: Record<string, Omit<EsBucket, 'key'>> | EsBucket[]): EsBucket[] {
  if (Array.isArray(buckets)) {
    return buckets;
  }

  return Object.entries(buckets).map(
    ([key, value]) => ({ key, ...value }),
  );
}

/**
 * Flatten ES buckets into one array, usable for figures
 *
 * @param rawBuckets ES buckets
 * @param elements Array of elements (extracted from figure parameters)
 * @param getKeyName Function to get the key name
 * @param i Current level
 *
 * @returns Array of FetchResultItems
 */
function flattenEsBuckets<Element extends Record<string, unknown>>(
  rawBuckets: any,
  elements: Element[],
  getKeyName: (el: Element) => string,
  i = 1,
): FetchResultItem[] {
  const current = elements[0];
  if (!current) {
    return [{ key: '', value: 0 }];
  }
  if (current.metric) {
    return [{ key: '', value: current.aggregation ? rawBuckets.metric.value : rawBuckets.doc_count }];
  }

  const aggregation = rawBuckets[`${i}`]; // See how data is fetched from ES
  if (!aggregation) {
    return [];
  }

  const data: FetchResultItem[] = [];
  const buckets = 'buckets' in aggregation ? aggregation.buckets : [aggregation];

  for (const bucket of ensureEsBuckets(buckets)) {
    // Flattening next sub agg
    const subBuckets = flattenEsBuckets(
      bucket,
      elements.slice(1),
      getKeyName,
      i + 1,
    );

    // Merging current bucket value with cleaned + combinations
    const bucketCombinations = subBuckets.flatMap((b) => ({
      ...b,
      key: bucket.key,
      [getKeyName(current)]: bucket.key,
    }));

    data.push(...bucketCombinations);
  }

  return data;
}

/**
 * Sort data for figures
 *
 * @param data The fetched data
 * @param figure The figure
 *
 * @returns Sorted data
 */
function sortData(data: FetchResultItem[], figure: FigureType): FetchResultItem[] {
  let order = figure.params.order as boolean | 'asc' | 'desc';
  if (order === false) {
    return data;
  }
  if (order === true) {
    order = 'desc';
  }

  return [...data].sort((a, b) => {
    const aValue = ensureInt(a.value);
    const bValue = ensureInt(b.value);

    let res = aValue - bValue;
    if (Number.isNaN(res)) {
      res = `${a.value}`.localeCompare(`${b.value}`);
    }

    return order === 'asc' ? res : -res;
  });
}

/**
 * Extract data for figures
 *
 * @param figure The figure
 * @param aggregations The aggregation results
 * @param count The count of document found
 *
 * @returns Array of ResultItems
 */
type HandleEsResultsFnc = (
  figure: FigureType,
  aggregations: EsAggregationResult,
  count: number | undefined,
) => FetchResultItem[];

/**
 * Extract data for metric figure
 *
 * @see {@link HandleEsResultsFnc}
 */
const handleMetricsEsResults: HandleEsResultsFnc = (
  { params },
  esData,
  count,
) => {
  let aggregationId = 1;
  const data: FetchResultItem[] = (params.labels as any[])
    .map(
      /**
       * Each item is a different label
       */
      (label) => {
        if (!label.aggregation) {
          return { key: `${label.text}`, value: count ?? 0 };
        }

        const aggregation = esData[`${aggregationId}`];
        aggregationId += 1;
        if (!('value' in aggregation) || typeof aggregation.value !== 'number') {
          throw new FetchError(
            'Aggregation value is missing for a metric figure',
            'NoDataError',
          );
        }

        return {
          key: `${label.text}`,
          value: aggregation.value ?? 0,
        };
      },
    );

  return data;
};

/**
 * Extract data for table figure
 *
 * @see {@link HandleEsResultsFnc}
 */
const handleTableEsResults: HandleEsResultsFnc = ({ params }, esData) => flattenEsBuckets(
  esData,
  params.columns,
  (col: any) => col.header,
);

/**
 * Extract data for others (mainly Vega) figures
 *
 * @see {@link HandleEsResultsFnc}
 */
const handleOtherEsResults: HandleEsResultsFnc = ({ params }, esData) => {
  // Get elements of figure
  let label = { type: 'label' };
  if (params.label) { label = { ...params.label, ...label }; }

  let color;
  if (params.color) { color = { ...params.color, type: 'color' }; }

  let value = { type: 'metric', metric: true };
  if (params.value) { value = { ...params.value, ...value }; }

  const elements = [
    label,
    color,
    value,
  ].filter((p) => !!p);

  // Flatten data
  return flattenEsBuckets(esData, elements, (col) => col.type);
};

/**
 * Extract data from ElasticSearch response and handle errors
 *
 * @param response The ES response
 * @param figure The figure
 *
 * @returns Sorted data
 */
export function handleEsResponse(
  response: EsResponse,
  figure: FigureType,
): FetchResultItem[] {
  checkEsErrors(response);

  // Guess the function we'll be using
  let handleResults = handleOtherEsResults;
  switch (figure.type) {
    case 'metric':
      handleResults = handleMetricsEsResults;
      break;
    case 'table':
      handleResults = handleTableEsResults;
      break;

    default:
      break;
  }

  const { aggregations, hits: { total } } = response;
  let elasticCount = total;
  if (typeof elasticCount === 'object') {
    elasticCount = elasticCount.value;
  }

  const data = handleResults(figure, aggregations || {}, elasticCount);

  return sortData(data, figure);
}
