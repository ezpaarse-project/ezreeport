import type { estypes as ElasticTypes } from '@elastic/elasticsearch';
import { merge } from 'lodash';

import { FigureAgg, type FigureAggType, type FigureType } from '~common/types/templates';

type EsAggregation = { [name: string]: ElasticTypes.AggregationsAggregationContainer };

/**
 * Transform aggregation to ElasticSearch's format
 *
 * @param agg The aggregation extracted from figure params
 * @param name The name of the aggregation
 * @param dateField The date field of the ES index
 * @param calendarInterval The calendar interval to give to any `date_histogram`
 * @param subAggs The sub aggregations
 *
 * @returns ElasticSearch's format
 */
function transformEsAgg(
  agg: FigureAggType,
  name: string,
  dateField: string,
  calendarInterval: string,
  subAggs?: EsAggregation,
): EsAggregation {
  if ('raw' in agg) {
    return {
      [name]: agg.raw,
    };
  }

  // Add additional fields for specific types
  const meta: Record<string, unknown> = {};
  switch (agg.type) {
    case 'date_histogram':
      meta.calendar_interval = calendarInterval;
      meta.time_zone = process.env.TZ;
      break;

    default:
      break;
  }

  // Replace `{{ dateField }}` by actual dateField
  if (/{{ ?dateField ?}}/.test(agg.field)) {
    meta.field = dateField;
  }

  // Order is a special case, so we handle it after

  return {
    [name]: {
      [agg.type]: {
        field: agg.field,
        missing: agg.missing,
        size: agg.size,
        ...meta,
      },
      aggregations: subAggs,
    },
  };
}

/**
 * Check if an aggregation exists, and if so check if it's valid
 *
 * @param schema The schema
 * @param value The value
 *
 * @see {@link assertIsSchema}
 */
function assertFigureAgg(aggregation: unknown): aggregation is FigureAggType {
  if (!aggregation) {
    return false;
  }

  // Will throw if invalid
  FigureAgg.parse(aggregation);
  return true;
}

/**
 * Merge extracted buckets and metric into one aggregation
 *
 * @param extracted The extracted buckets and metric
 * @param dateField The date field of the ES index
 * @param calendarInterval The calendar interval to give to any `date_histogram`
 * @param order The order of the aggregation
 *
 * @returns One big aggregation
 */
function mergeExtractedEsBuckets(
  extracted: { buckets: FigureAggType[], metric: FigureAggType | undefined },
  dateField: string,
  calendarInterval: string,
  order: boolean | 'asc' | 'desc',
): (EsAggregation | undefined)[] {
  const metric = extracted.metric ? transformEsAgg(extracted.metric, 'metric', dateField, calendarInterval) : undefined;

  const aggregations: EsAggregation | undefined = extracted.buckets.reduce(
    (subAggregations, bucket, i): EsAggregation => {
      const name = `${extracted.buckets.length - i}`; // Similar to how data is fetched from ES by Kibana
      let aggregation = transformEsAgg(bucket, name, dateField, calendarInterval, subAggregations);

      // Add metric to all bucket (if it exists)
      if (metric) {
        aggregation = {
          ...metric,
          ...aggregation,
        };
      }

      // Add order cause it needs to be on the same level as `field`
      if (!('raw' in bucket) && order !== false) {
        merge(aggregation, { [name]: { [bucket.type]: { order: { _count: order === 'asc' ? 'asc' : 'desc' } } } });
      }

      return aggregation;
    },
    metric,
  );

  return [
    metric,
    aggregations,
  ];
}

/**
 * Extract aggregations for figures
 *
 * @param figure The figure
 * @param dateField The date field of the ES index
 * @param calendarInterval The calendar interval to give to any `date_histogram`
 *
 * @returns Array of aggregations, or buckets and metric to merge in one aggregation
 */
type ExtractEsAggregationsFnc = (
  figure: FigureType,
  dateField: string,
  calendarInterval: string,
) => {
  aggregations: FigureAggType[],
} | {
  buckets: FigureAggType[],
  metric: FigureAggType | undefined,
};

/**
 * Extract aggregations for metric figure
 *
 * @see {@link ExtractEsAggregationsFnc}
 */
const extractMetricsEsAggregations: ExtractEsAggregationsFnc = ({ params }) => {
  const labelsToFetchCount = new Set<string>();

  const aggregations: FigureAggType[] = (params.labels as any[])
    .map(
      (label) => {
        const hasAggregation = assertFigureAgg(label.aggregation);
        if (!hasAggregation) {
          labelsToFetchCount.add(label.text);
          return undefined;
        }
        return label.aggregation;
      },
    ).filter((aggregation) => !!aggregation);

  return { aggregations };
};

/**
 * Extract aggregations for table figure
 *
 * @see {@link ExtractEsAggregationsFnc}
 */
const extractTableEsAggregations: ExtractEsAggregationsFnc = ({ params }) => {
  const buckets: FigureAggType[] = [];
  let metric: FigureAggType | undefined;

  // eslint-disable-next-line no-restricted-syntax
  for (const column of params.columns) {
    if (assertFigureAgg(column.aggregation)) {
      if (!column.metric) {
        buckets.unshift(column.aggregation);
      } else {
        if (metric) {
          throw new Error('More than one metric in table');
        }
        metric = column.aggregation;
      }
    }
  }

  return {
    buckets,
    metric,
  };
};

/**
 * Extract aggregations for others (mainly Vega) figures
 *
 * @see {@link ExtractEsAggregationsFnc}
 */
const extractOtherEsAggregations: ExtractEsAggregationsFnc = ({ params }) => {
  const buckets: FigureAggType[] = [];
  let metric: FigureAggType | undefined;

  if (assertFigureAgg(params.value.aggregation)) {
    metric = params.value.aggregation;
  }
  if (assertFigureAgg(params.color?.aggregation)) {
    buckets.push(params.color.aggregation);
  }
  if (assertFigureAgg(params.label.aggregation)) {
    buckets.push(params.label.aggregation);
  }

  return {
    buckets,
    metric,
  };
};

/**
 * Prepare aggregations for ElasticSearch based on figures parameters
 *
 * @param figure The figure
 * @param dateField The date field of the ES index
 * @param calendarInterval The calendar interval to give to any `date_histogram`
 *
 * @returns Object with `aggregations` ready to be sent to ElasticSearch
 */
// eslint-disable-next-line import/prefer-default-export
export function prepareEsAggregations(
  figure: FigureType,
  dateField: string,
  calendarInterval: string,
): EsAggregation {
  // Guess the function we'll be using
  let extractBuckets = extractOtherEsAggregations;
  switch (figure.type) {
    case 'metric':
      extractBuckets = extractMetricsEsAggregations;
      break;
    case 'table':
      extractBuckets = extractTableEsAggregations;
      break;

    default:
      break;
  }

  // Transform aggregations for ElasticSearch
  let aggregations: (EsAggregation | undefined)[] = [];
  const extracted = extractBuckets(figure, dateField, calendarInterval);
  if ('buckets' in extracted) {
    // If we have buckets, we need to merge them in one big aggregation
    aggregations = mergeExtractedEsBuckets(
      extracted,
      dateField,
      calendarInterval,
      figure.params.order,
    );
  } else {
    // If we have multiple aggregations, just transform them
    aggregations = extracted.aggregations.map(
      (agg, i) => transformEsAgg(agg, `${i + 1}`, dateField, calendarInterval),
    );
  }

  return merge({}, ...aggregations.filter((agg) => !!agg));
}
