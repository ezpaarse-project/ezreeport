import type { estypes as ElasticTypes } from '@elastic/elasticsearch';
import { merge } from 'lodash';

import { assertIsSchema, Type, type Static } from '~/lib/typebox';

import { FigureType } from '~/models/figures';

const FigureAgg = Type.Union([
  Type.Object({
    type: Type.String({ minLength: 1 }),
    field: Type.String({ minLength: 1 }),
    missing: Type.Optional(Type.String({ minLength: 0 })),
  }),
  // OR
  Type.Object({
    raw: Type.Record(Type.String(), Type.Any()),
  }),
]);

export type FigureAggType = Static<typeof FigureAgg>;

type ExtractedFigureAggType = FigureAggType & {
  size?: number,
};

type EsAggregation = { [name: string]: ElasticTypes.AggregationsAggregationContainer };

function transformEsAgg(
  agg: ExtractedFigureAggType,
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

function assertFigureAgg(aggregation: unknown): aggregation is FigureAggType {
  if (!aggregation) {
    return false;
  }

  assertIsSchema(FigureAgg, aggregation);
  return true;
}

type ExtractEsAggregationsFnc = (
  params: FigureType,
  dateField: string,
  calendarInterval: string,
) => {
  aggregations: ExtractedFigureAggType[],
} | {
  buckets: ExtractedFigureAggType[],
  metric: ExtractedFigureAggType | undefined,
};

function mergeExtractedEsBuckets(
  extracted: { buckets: ExtractedFigureAggType[], metric: ExtractedFigureAggType | undefined },
  dateField: string,
  calendarInterval: string,
  order: boolean | 'asc' | 'desc',
): (EsAggregation | undefined)[] {
  const metric = extracted.metric ? transformEsAgg(extracted.metric, 'metric', dateField, calendarInterval) : undefined;

  const aggregations: EsAggregation | undefined = extracted.buckets.reduce(
    (subAggregations, bucket, i): EsAggregation => {
      const name = `${extracted.buckets.length - i}`;
      let aggregation = transformEsAgg(bucket, name, dateField, calendarInterval, subAggregations);

      // Add metric to all bucket (if it exists)
      if (metric) {
        aggregation = {
          ...metric,
          ...aggregation,
        };
      }

      // Add order
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

export default function prepareEsAggregations(
  figure: FigureType,
  dateField: string,
  calendarInterval: string,
): EsAggregation {
  // Extract aggregations
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
    aggregations = mergeExtractedEsBuckets(
      extracted,
      dateField,
      calendarInterval,
      figure.params.order,
    );
  } else {
    aggregations = extracted.aggregations.map(
      (agg, i) => transformEsAgg(agg, `${i + 1}`, dateField, calendarInterval),
    );
  }

  return merge({}, ...aggregations.filter((agg) => !!agg));
}
