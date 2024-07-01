import { scheme as vegaScheme, expressionFunction } from 'vega';
import type { Mark } from 'vega-lite/build/src/mark';
import { get, set, merge } from 'lodash';
import dfns from 'date-fns';
import { contrast } from 'chroma-js';

import { UnitSpec } from 'vega-lite/build/src/spec';
import config from '~/lib/config';

import { calcVegaFormat } from '~/models/recurrence';
import { Recurrence } from '~/lib/prisma';

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
  dataKey?: string,
  dataLayer?: CustomLayer;
  value: SubEncoding<'x' | 'y' | 'theta'> & { field: string };
  label: SubEncoding<'x' | 'y' | 'color'> & { field: string },
  color?: Encoding['color'] & { field: string },
  dataLabel?: {
    format: 'percent' | 'numeric',
    position?: 'out' | 'in',
    showLabel?: boolean
    minValue?: number,
  }
};

const { scheme } = config.report;

type ArcRadius = {
  outer: number;
  inner: number;
  center: number;
};

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
const calcRadius = (params: VegaParams): ArcRadius => {
  const outerRadius = Math.min(params.height, params.width) / 2;
  const innerRadius = outerRadius * RADIUS_OUTER_INNER_RATIO;
  return {
    outer: Math.round(outerRadius),
    inner: Math.round(innerRadius),
    center: Math.round(innerRadius + ((outerRadius - innerRadius) / 2)),
  };
};

/**
 * Calculate score of date labels
 *
 * @param data The data to display
 * @param field The path to the date field
 *
 * @returns The score
 */
const calcLabelDateScore = (data: any[], field: string) => {
  const sliceLength = data.length / 2;
  const count = data
    .slice(0, sliceLength)
    .reduce(
      (prev, value) => {
        const label = new Date(get(value, field));
        return prev + (dfns.isValid(label) ? 1 : 0);
      },
      0,

    );

  return (count / sliceLength);
};

/**
 * Prepare color scale
 *
 * @param type The type of figure
 * @param data The data to display
 * @param params The params of the figure
 *
 * @returns The color scale
 */
const prepareDataWithDefaultDates = (
  type: Mark,
  data: any[],
  params: VegaParams,
) => {
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

  const defaultData = eachUnitOfInterval(params.period).map((date) => {
    const object = {} as Record<string, unknown>;
    set(object, params.label.field, new Date(date).getTime());
    set(object, params.value.field, 0);
    return object;
  });

  return [
    ...defaultData,
    ...data,
  ];
};

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
const prepareColorScale = (
  type: Mark,
  data: any[],
  params: VegaParams,
  colorFieldPath = 'label.field',
) => {
  // Parsing labels to get correct colors
  const colorField = get(params, colorFieldPath) as string;

  if (!colorField) {
    return {
      domain: [],
      range: [],
    };
  }

  const colorsEntries = new Map<string, string>();
  const unusedColorsSet = new Set(colorScheme);

  const labels = new Set(data.map((el): string => get(el, colorField)));
  // eslint-disable-next-line no-restricted-syntax
  for (const label of [...labels]) {
    const color = params.colorMap.get(label);
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
    params.colorMap.set(label, color);
  }

  return {
    domain: Array.from(colorsEntries.keys()),
    range: Array.from(colorsEntries.values()),
  };
};

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
  data: any[],
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
const prepareDataLabelsLayers = (
  type: Mark,
  data: any[],
  params: VegaParams,
  radius?: ArcRadius,
  valueAxis = 'y',
): { dataLayerEdits: Layer, layers?: Layer[] } => {
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
          field: params.value.field,
        },
      },
      // FIXME: WARN Dropping since it does not contain any data field, datum, value, or signal.
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
    merge(layer, { encoding: { detail: { field: params.color.field } } });
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
            field: params.value.field,
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
      const totalDocs = data.reduce((prev, value) => prev + get(value, params.value.field), 0);
      const minValue = params.dataLabel.minValue ?? 0.03;
      condition = `datum['${textAggregatePrefix}${params.value.field}'] / ${totalDocs} >= ${minValue}`;

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
        minValue = (Math.max(...data.map((value) => get(value, params.value.field)), 0)) * 0.03;
      }

      condition = `(datum['${textAggregatePrefix}${params.value.field}']) >= ${minValue}`;
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
          field: params.color?.field || params.label.field,
        },
      },
      color: layer.encoding?.color,
    },
  });

  return { dataLayerEdits, layers: [layer, labelLayer] };
};

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

/**
 * Create a vega-lite spec for a arc chart from ezREEPORT's params
 *
 * @param type The type of figure
 * @param data The data to display
 * @param params The params of the figure
 *
 * @returns Partial vega-lite spec
 */
export const createArcSpec = (
  type: Mark,
  data: any[],
  params: VegaParams,
): { layer: Layer[], encoding: Encoding, data?: any[] } => {
  // Calculating arc radius if needed
  const radius = calcRadius(params);

  const dataLayer = prepareDataLayer(type, data, params);
  merge(dataLayer, { mark: { radius: radius.outer, radius2: radius.inner } });

  // Prepare encoding
  const encoding: Encoding = {
    theta: merge<Encoding['theta'], VegaParams['value']>(
      { stack: true, type: 'quantitative' },
      params.value,
    ),
    order: merge<Encoding['order'], VegaParams['value']>(
      { sort: 'descending', type: 'quantitative' },
      params.value,
    ),
    color: merge<Encoding['color'], VegaParams['label']>(
      {
        scale: prepareColorScale(type, data, params),
        // @ts-ignore
        sort: { field: params.value.field, order: params.value.order ?? 'descending' },
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
export const createBarSpec = (
  type: Mark,
  data: any[],
  params: VegaParams,
): { layer: Layer[], encoding: Encoding, data?: any[] } => {
  const [valueAxis, labelAxis] = (params.invertAxis ? ['x', 'y'] : ['y', 'x']) as ('x' | 'y')[];

  const dataLayer = prepareDataLayer(type, data, params);

  // Prepare encoding
  const encoding: Encoding = {
    [valueAxis]: merge<Encoding[typeof valueAxis], VegaParams['value']>(
      { stack: 'zero', type: 'quantitative' },
      params.value,
    ),
    [labelAxis]: merge<Encoding[typeof labelAxis], VegaParams['label']>(
      { type: 'nominal', title: null, sort: `-${valueAxis}` },
      params.label,
    ),
    color: merge<Encoding['color'], VegaParams['color']>(
      { scale: prepareColorScale(type, data, params, 'color.field') },
      params.color,
    ),
  };

  let editedData;
  // If more than 3/8 label's data is date, consider whole axis as a date
  // and sets format based on task recurrence
  if (calcLabelDateScore(data, params.label.field) > 0.75) {
    const timeFormat = calcVegaFormat(params.recurrence);

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
 * Create a vega-lite spec for generic graph from ezREEPORT's params
 *
 * @param type The type of figure
 * @param data The data to display
 * @param params The params of the figure
 *
 * @returns Partial vega-lite spec
 */
export const createOtherSpec = (
  type: Mark,
  data: any[],
  params: VegaParams,
): { layer: Layer[], encoding: Encoding, data?: any[] } => {
  const dataLayer = prepareDataLayer(type, data, params);

  // Prepare encoding
  const encoding: Encoding = {
    x: params.value,
    y: params.label,
    color: merge<Encoding['color'], VegaParams['color']>(
      { scale: prepareColorScale(type, data, params, 'color.field') },
      params.color,
    ),
  };

  // Prepare data labels
  const {
    dataLayerEdits,
    layers: dataLabelLayers = [],
  } = prepareDataLabelsLayers(type, data, params);
  merge(dataLayer, dataLayerEdits);

  return { layer: mergeLayers(dataLayer, ...dataLabelLayers), encoding };
};
