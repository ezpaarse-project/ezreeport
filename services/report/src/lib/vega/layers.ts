import { scheme as vegaScheme, expressionFunction } from 'vega';
import type { Mark } from 'vega-lite/build/src/mark';
import { merge } from 'lodash';
import dfns from 'date-fns';
import { contrast } from 'chroma-js';

import type { UnitSpec } from 'vega-lite/build/src/spec';

import type { FetchResultItem, FetchResultValue } from '~/models/reports/generation/fetch/results';
import { calcVegaFormatFromRecurrence } from '~/models/recurrence';
import config from '~/lib/config';
import { Recurrence } from '~/lib/prisma';
import { ensureInt } from '~/lib/utils';

/**
 * Params for createVegaLSpec
 */
export type Layer = UnitSpec<string>;
export type Encoding = Exclude<Layer['encoding'], undefined>;
export type SubEncoding<T extends keyof Encoding> = Exclude<Encoding[T], undefined | null>;
// Hide 'mark.type' property for overriding it
export type CustomLayer = Omit<Layer, 'mark'> & { mark: Omit<Layer['mark'], 'type'> };

export type VegaParams = {
  // Auto fields
  /**
   * Width of the graph, should match PDF viewport
   */
  width: number;
  /**
   * Width of the graph, should match PDF viewport
   */
  height: number;
  debugExport?: boolean,
  recurrence: Recurrence,
  period: dfns.Interval,
  colorMap: Map<string, string>,
  // Figure specific
  invertAxis?: boolean,
  dataLayer?: CustomLayer;
  order?: 'asc' | 'desc',
  value: SubEncoding<'x' | 'y' | 'theta'>;
  label: SubEncoding<'x' | 'y' | 'color'>,
  color?: Encoding['color'],
  dataLabel?: {
    format: 'percent' | 'numeric',
    position?: 'out' | 'in',
    showLabel?: boolean
    minValue?: number,
  }
};

type ArcRadius = {
  outer: number;
  inner: number;
  center: number;
};

type PartialFigureSpec = {
  layer: Layer[],
  encoding: Encoding,
  data?: unknown[]
};

const { scheme } = config.report;

// Colors of vega (https://vega.github.io/vega/docs/schemes/)
const colorScheme = vegaScheme(scheme) as string[];
// Colors of labels for colors of Vega
const labelScheme = `${scheme}.labels`;
vegaScheme(labelScheme, colorScheme.map((c) => (contrast(c, 'black') > 5 ? 'black' : 'white')));

/**
 * Ratio between outer and inner radius.
 * Higher means thinner, lower means wider
 */
const RADIUS_OUTER_INNER_RATIO = 0.5;

/**
 * Calculate arc radius
 *
 * @param params The params of the figure
 *
 * @returns Arc radius
 */
function calcRadius(params: VegaParams): ArcRadius {
  const outerRadius = Math.min(params.height, params.width) / 2;
  const innerRadius = outerRadius * RADIUS_OUTER_INNER_RATIO;
  return {
    outer: Math.round(outerRadius),
    inner: Math.round(innerRadius),
    center: Math.round(innerRadius + ((outerRadius - innerRadius) / 2)),
  };
}

/**
 * Calculate score of date labels
 *
 * @param data The data to display
 * @param field The path to the date field
 *
 * @returns The score
 */
function calcLabelDateScore(data: FetchResultItem[]) {
  const sample = data.slice(0, data.length / 2);
  const count = sample
    .reduce(
      (prev: number, { label }) => {
        const labelDate = new Date(ensureInt(label || 'undefined'));
        return prev + (dfns.isValid(labelDate) ? 1 : 0);
      },
      0,
    );

  return (count / sample.length);
}

/**
 * Prepare color scale
 *
 * @param type The type of figure
 * @param data The data to display
 * @param params The params of the figure
 *
 * @returns The color scale
 */
function prepareDataWithDefaultDates(
  type: Mark,
  data: FetchResultItem[],
  params: VegaParams,
) {
  let eachUnitOfInterval;
  switch (params.recurrence) {
    case Recurrence.DAILY:
      eachUnitOfInterval = dfns.eachHourOfInterval;
      break;

    case Recurrence.WEEKLY:
    case Recurrence.MONTHLY:
      eachUnitOfInterval = dfns.eachDayOfInterval;
      break;

    case Recurrence.QUARTERLY:
    case Recurrence.BIENNIAL:
    case Recurrence.YEARLY:
      eachUnitOfInterval = dfns.eachMonthOfInterval;
      break;

    default:
      throw new Error('Recurrence not found');
  }

  const defaultData = eachUnitOfInterval(params.period).map((date): FetchResultItem => {
    const key = new Date(date).getTime();
    return {
      key,
      value: 0,
      label: key,
    };
  });

  return [
    ...defaultData,
    ...data,
  ];
}

/**
 * Prepare color scale
 *
 * @param type The type of figure
 * @param data The data to display
 * @param params The params of the figure
 * @param colorFieldPath The path to the color field
 *
 * @returns The color scale
 */
function prepareColorScale(
  type: Mark,
  data: FetchResultItem[],
  params: VegaParams,
  getLabel = (el: FetchResultItem): FetchResultValue => el.label || '',
) {
  const colorsEntries = new Map<FetchResultValue, string>();
  const unusedColorsSet = new Set(colorScheme);

  const labels = new Set(data.map((el) => getLabel(el)));
  if (labels.size <= 0) {
    return undefined;
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const label of [...labels]) {
    const color = params.colorMap.get(`${label}`);
    if (color) {
      // Use known color
      colorsEntries.set(label, color);
      // Remove color from unused
      unusedColorsSet.delete(color);
      // Remove from labels since we used it
      labels.delete(label);
    }
  }

  // Set leftovers with unused colors
  const unusedColors = [...unusedColorsSet];
  // eslint-disable-next-line no-restricted-syntax
  for (const label of labels) {
    const color = unusedColors.shift() || '';
    colorsEntries.set(label, color);
    params.colorMap.set(`${label}`, color);
  }

  return {
    domain: Array.from(colorsEntries.keys()),
    range: Array.from(colorsEntries.values()),
  };
}

/**
 * Prepare layers for data labels
 *
 * @param type The type of figure
 * @param data The data to display
 * @param params The params of the figure
 * @param radius The radius of an arc figure
 * @param valueAxis The axis with the values
 *
 * @returns Layers for data labels
 */
function prepareDataLabelsLayers(
  type: Mark,
  data: FetchResultItem[],
  params: VegaParams,
  radius?: ArcRadius,
  valueAxis = 'y',
): { dataLayerEdits: Layer, layers?: Layer[] } {
  const dataLayerEdits = {} as Layer;

  if (!params.dataLabel) {
    return { dataLayerEdits };
  }

  const pos: Record<string, number> = {};
  if (radius?.center) {
    switch (params.dataLabel.position) {
      case 'out': {
        pos.radius = radius.outer - (params.dataLabel.showLabel ? 22 : 11);
        const r = 0.8 * pos.radius;

        merge(dataLayerEdits, { mark: { radius: r, radius2: r * RADIUS_OUTER_INNER_RATIO } });
        break;
      }

      case 'in':
      default:
        pos.radius = radius.center;
        break;
    }
  }

  const layer: Layer = {
    mark: {
      type: 'text',
      align: 'center',
      baseline: 'middle',
    },
    encoding: {
      text: {
        condition: {
          test: 'true',
          field: 'value',
        },
      },
      // FIXME: WARN Dropping since it does not contain unknown data field, datum, value, or signal.
      color: {
        legend: null,
        scale: {
          // @ts-ignore
          scheme: labelScheme,
        },
      },
    },
  };

  if (params.color) {
    merge(layer, { encoding: { detail: { field: 'color' } } });
  }

  if (params.dataLabel.showLabel) {
    merge(layer, { mark: { dy: 7, fontWeight: 'bold' } });
  }

  let textAggregate = '';
  switch (type) {
    case 'arc':
      merge(layer, {
        mark: {
          radius: pos.radius,
          limit: Math.max((radius?.outer ?? 0) - (radius?.inner ?? 0) - 10, 0),
        },
      });
      break;

    case 'bar':
      if (params.color) {
        textAggregate = 'sum';
      }

      merge(layer, {
        encoding: {
          text: { condition: { aggregate: textAggregate } },
          // eslint-disable-next-line no-useless-computed-key
          [valueAxis]: {
            aggregate: textAggregate,
            field: 'value',
            bandPosition: 0.5,
          },
        },
      });
      break;

    default:
      break;
  }
  const textAggregatePrefix = textAggregate && `${textAggregate}_`;

  // Format data labels and prepare condition
  let condition: string | undefined;
  switch (params.dataLabel.format) {
    case 'percent': {
      const totalDocs = data.reduce(
        (prev: number, item) => {
          const value = ensureInt(item.value);
          if (Number.isNaN(value)) {
            return prev;
          }
          return prev + value;
        },
        0,
      );
      const minValue = params.dataLabel.minValue ?? 0.03;
      condition = `datum['${textAggregatePrefix}value'] / ${totalDocs} >= ${minValue}`;

      expressionFunction(
        'dataLabelFormat',
        (v: string): string => {
          const perc = +v / totalDocs;
          return perc.toLocaleString('fr-FR', { style: 'percent', maximumFractionDigits: 2 });
        },
      );

      merge(layer, {
        encoding: {
          text: {
            condition: {
              test: condition,
              format: '',
              formatType: 'dataLabelFormat',
            },
          },
        },
      });
      break;
    }

    default: {
      let { minValue } = params.dataLabel;
      if (minValue == null) {
        // default to 3% of maximum value
        minValue = (Math.max(...data.map((item) => ensureInt(item.value)), 0)) * 0.03;
      }

      condition = `(datum['${textAggregatePrefix}value']) >= ${minValue}`;
      merge(layer, { encoding: { text: { condition: { test: condition } } } });
      break;
    }
  }

  if (!params.dataLabel.showLabel) {
    return { dataLayerEdits, layers: [layer] };
  }

  // Add label layer
  const labelLayer = ({
    mark: merge(
      {},
      layer.mark,
      {
        dy: -7,
        fontWeight: 'normal',
      },
    ),
    encoding: {
      y: layer.encoding?.y,
      x: layer.encoding?.x,
      text: {
        condition: {
          test: condition ?? 'true',
          field: params.color ? 'color' : 'label',
        },
      },
      color: layer.encoding?.color,
    },
  });

  return { dataLayerEdits, layers: [layer, labelLayer] };
}

/**
 * Prepare data layer
 *
 * @param type The type of figure
 * @param data The data to display
 * @param params The params of the figure
 *
 * @returns The layer for data
 */
const prepareDataLayer = (
  type: Mark,
  data: FetchResultItem[],
  params: VegaParams,
): Layer => merge<Layer, CustomLayer | {}>(
  {
    mark: {
      type,
      point: true,
    },
  },
  params.dataLayer ?? {},
);

/**
 * Merge data layer and layers
 *
 * @param dataLayer The layer that contains the data
 * @param layers The layers to merge
 *
 * @returns The layers ready to be used in a vega-lite spec
 */
const mergeLayers = (dataLayer: Layer, ...layers: (Layer | undefined)[]): Layer[] => [
  dataLayer,
  ...layers.filter((l): l is Layer => !!l),
];

type CreateSpecFnc = (type: Mark, data: FetchResultItem[], params: VegaParams) => PartialFigureSpec;

/**
 * Create a vega-lite spec for a arc chart from ezREEPORT's params
 *
 * @param type The type of figure
 * @param data The data to display
 * @param params The params of the figure
 *
 * @returns Partial vega-lite spec
 */
export const createArcSpec: CreateSpecFnc = (type, data, params) => {
  // Calculating arc radius if needed
  const radius = calcRadius(params);

  const dataLayer = prepareDataLayer(type, data, params);
  merge(dataLayer, { mark: { radius: radius.outer, radius2: radius.inner } });

  // Prepare encoding
  const encoding: Encoding = {
    theta: merge<Encoding['theta'], VegaParams['value']>(
      { field: 'value', stack: true, type: 'quantitative' },
      params.value,
    ),
    order: merge<Encoding['order'], VegaParams['value']>(
      { field: 'value', sort: 'descending', type: 'quantitative' },
      params.value,
    ),
    color: merge<Encoding['color'], VegaParams['label']>(
      {
        field: 'label',
        scale: prepareColorScale(type, data, params),
        // @ts-ignore
        sort: { field: 'value', order: params.order === 'asc' ? 'ascending' : 'descending' },
        legend: { orient: 'top-right' },
      },
      params.label,
    ),
  };

  // Prepare data labels
  const {
    dataLayerEdits,
    layers: dataLabelLayers = [],
  } = prepareDataLabelsLayers(type, data, params, radius);
  merge(dataLayer, dataLayerEdits);

  return { layer: mergeLayers(dataLayer, ...dataLabelLayers), encoding };
};

/**
 * Create a vega-lite spec for a bar chart from ezREEPORT's params
 *
 * @param type The type of figure
 * @param data The data to display
 * @param params The params of the figure
 *
 * @returns Partial vega-lite spec
 */
export const createBarSpec: CreateSpecFnc = (type, data, params) => {
  const [valueAxis, labelAxis] = (params.invertAxis ? ['x', 'y'] : ['y', 'x']) as ('x' | 'y')[];

  const dataLayer = prepareDataLayer(type, data, params);

  // Prepare encoding
  const encoding: Encoding = {
    [valueAxis]: merge<Encoding[typeof valueAxis], VegaParams['value']>(
      { field: 'value', stack: 'zero', type: 'quantitative' },
      params.value,
    ),
    [labelAxis]: merge<Encoding[typeof labelAxis], VegaParams['label']>(
      {
        field: 'label',
        type: 'nominal',
        title: null,
        sort: `-${valueAxis}`,
      },
      params.label,
    ),
    color: params.color ? merge<Encoding['color'], VegaParams['color']>(
      { field: 'color', scale: prepareColorScale(type, data, params, (el) => el.color || '') },
      params.color,
    ) : undefined,
    order: { aggregate: 'count' },
  };

  let editedData;
  // If more than 3/8 label's data is date, consider whole axis as a date
  // and sets format based on task recurrence
  if (calcLabelDateScore(data) > 0.75) {
    const timeFormat = calcVegaFormatFromRecurrence(params.recurrence);

    editedData = prepareDataWithDefaultDates(type, data, params);

    merge<Encoding[typeof labelAxis], Encoding[typeof labelAxis]>(
      encoding[labelAxis],
      { timeUnit: timeFormat.timeUnit, axis: { format: timeFormat.format }, sort: 'ascending' },
    );
  }

  // Prepare data labels
  const {
    dataLayerEdits,
    layers: dataLabelLayers = [],
  } = prepareDataLabelsLayers(type, data, params, undefined, valueAxis);
  merge(dataLayer, dataLayerEdits);

  return { layer: mergeLayers(dataLayer, ...dataLabelLayers), data: editedData, encoding };
};

/**
 * Create a vega-lite spec for line graph from ezREEPORT's params
 *
 * @param type The type of figure
 * @param data The data to display
 * @param params The params of the figure
 *
 * @returns Partial vega-lite spec
 */
export const createLineSpec: CreateSpecFnc = (type, data, params) => {
  const dataLayer = prepareDataLayer(type, data, params);

  // Prepare encoding
  const encoding: Encoding = {
    y: merge<Encoding['y'], VegaParams['value']>(
      { field: 'value', stack: 'zero', type: 'quantitative' },
      params.value,
    ),
    x: merge<Encoding['x'], VegaParams['label']>(
      {
        field: 'label',
        type: 'nominal',
        title: null,
        sort: params.order && (params.order === 'asc' ? 'y' : '-y'),
      },
      params.label,
    ),
  };

  // If more than 3/8 label's data is date, consider whole axis as a date
  // and sets format based on task recurrence
  if (calcLabelDateScore(data) > 0.75) {
    const timeFormat = calcVegaFormatFromRecurrence(params.recurrence);

    merge<Encoding['x'], Encoding['x']>(
      encoding.x,
      { timeUnit: timeFormat.timeUnit, axis: { format: timeFormat.format }, sort: 'ascending' },
    );
  }

  // Prepare data labels
  const {
    dataLayerEdits,
    layers: dataLabelLayers = [],
  } = prepareDataLabelsLayers(type, data, params);
  merge(dataLayer, dataLayerEdits);

  return { layer: mergeLayers(dataLayer, ...dataLabelLayers), encoding };
};

/**
 * Create a vega-lite spec for generic graph from ezREEPORT's params
 *
 * @param type The type of figure
 * @param data The data to display
 * @param params The params of the figure
 *
 * @returns Partial vega-lite spec
 */
export const createOtherSpec: CreateSpecFnc = (type, data, params) => {
  const dataLayer = prepareDataLayer(type, data, params);

  // Prepare encoding (using merges to avoid type issues)
  const encoding: Encoding = {
    x: merge<Encoding['x'], VegaParams['value']>(
      { field: 'value' },
      params.value,
    ),
    y: merge<Encoding['y'], VegaParams['label']>(
      { field: 'label' },
      params.label,
    ),
    color: params.color ? merge<Encoding['color'], VegaParams['color']>(
      { field: 'color', scale: prepareColorScale(type, data, params) },
      params.color,
    ) : undefined,
  };

  // Prepare data labels
  const {
    dataLayerEdits,
    layers: dataLabelLayers = [],
  } = prepareDataLabelsLayers(type, data, params);
  merge(dataLayer, dataLayerEdits);

  return { layer: mergeLayers(dataLayer, ...dataLabelLayers), encoding };
};
