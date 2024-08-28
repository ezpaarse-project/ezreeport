import type { estypes as ElasticTypes } from '@elastic/elasticsearch';

import { FigureType } from '~/models/figures';

type EsResponse = ElasticTypes.MsearchResponseItem<Record<string, unknown>>;
type EsAggregationResult = Record<string, ElasticTypes.AggregationsAggregate>;
type EsBucket = { key: string | number | bigint | boolean, [x: string]: unknown };

export type FetchResultItem = {
  key: string | number | bigint | boolean,
  keyAsString?: string,
  value: string | number | bigint | boolean,
  valueAsString?: string,
  [x: string]: string | number | bigint | boolean | undefined,
};

function checkEsErrors(response: EsResponse, cause: unknown) {
  // Checks any errors
  if ('error' in response) {
    const reason = response.error.failed_shards?.[0]?.reason?.reason || response.error.reason;
    throw new Error(reason, { cause });
  }

  // Checks any errors
  if (response._shards.failures?.length) {
    const reasons = response._shards.failures.map((err) => err.reason.reason).join(' ; ');
    throw new Error(`An error occurred when fetching data : ${reasons}`, { cause });
  }

  // Checks if there's data
  if (
    response.hits.total
    && typeof response.hits.total === 'object'
      ? response.hits.total.value === 0
      : response.hits.total === 0
  ) {
    throw new Error('No data found for given request. Please review filters or aggregations of figures.', { cause });
  }
}

function ensureEsBuckets(buckets: Record<string, Omit<EsBucket, 'key'>> | EsBucket[]): EsBucket[] {
  if (Array.isArray(buckets)) {
    return buckets;
  }

  return Object.entries(buckets).map(
    ([key, value]) => ({ key, ...value }),
  );
}

function flattenEsBuckets<Element extends Record<string, unknown>>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const data: FetchResultItem[] = [];
  const aggregation = rawBuckets[`${i}`];
  const buckets = 'buckets' in aggregation ? aggregation.buckets : [aggregation];

  // eslint-disable-next-line no-restricted-syntax
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

type HandleEsResultsFnc = (
  figure: FigureType,
  aggregations: EsAggregationResult,
  count: number | undefined,
  errorCause: unknown,
) => FetchResultItem[];

const handleMetricsEsResults: HandleEsResultsFnc = (
  { params },
  esData,
  count,
  errorCause,
) => {
  const data: FetchResultItem[] = (params.labels as any[])
    .map(
      /**
       * Each item is a different label
       */
      (label, i) => {
        if (!label.aggregation) {
          return { key: `${label.text}`, value: count ?? 0 };
        }

        const aggregation = esData[`${i}`];
        if (!('value' in aggregation) || typeof aggregation.value !== 'number') {
          throw new Error('Aggregation value is missing for a metric figure', { cause: errorCause });
        }

        return {
          key: `${label.text}`,
          value: aggregation.value ?? 0,
        };
      },
    ).filter((result) => !!result);

  return data;
};

const handleTableEsResults: HandleEsResultsFnc = ({ params }, esData) => flattenEsBuckets(
  esData,
  params.columns,
  (col: any) => col.header,
);

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

export default function handleEsResponse(
  { response, count }: { response: EsResponse, count: number | undefined },
  figure: FigureType,
  errorCause: unknown,
): FetchResultItem[] {
  checkEsErrors(response, errorCause);

  if (!('aggregations' in response) || !response.aggregations) {
    throw new Error('No aggregations in response', { cause: errorCause });
  }

  // Handle results
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

  // TODO: sort, order ?

  return handleResults(
    figure,
    response.aggregations,
    count,
    errorCause,
  );
}
