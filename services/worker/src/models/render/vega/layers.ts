import {
  scheme as vegaScheme,
  type Text,
  type ExprRef,
  type SignalRef,
} from 'vega';
import type { Mark } from 'vega-lite/types_unstable/mark.js';
import type { UnitSpec } from 'vega-lite/types_unstable/spec/unit.js';
import type { TitleParams } from 'vega-lite/types_unstable/title.js';
import { merge } from 'lodash';
import chroma from 'chroma-js';

import * as dfns from '@ezreeport/dates';
import { ensureInt } from '@ezreeport/models/lib/utils';
import type { RecurrenceType } from '@ezreeport/models/recurrence';

import config from '~/lib/config';

import type { FetchResultItem, FetchResultValue } from '~/models/fetch/results';
import { calcVegaFormatFromRecurrence } from '~/models/recurrence';

export type Title = Text | TitleParams<ExprRef | SignalRef>;
/**
 * Params for createVegaLSpec
 */
export type Layer = UnitSpec<string>;
export type Encoding = Exclude<Layer['encoding'], undefined>;
export type SubEncoding<En extends keyof Encoding> = Exclude<
  Encoding[En],
  undefined | null
>;
// Hide 'mark.type' property for overriding it
export type CustomLayer = Omit<Layer, 'mark'> & {
  mark: Omit<Layer['mark'], 'type'>;
};

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
  debugExport?: boolean;
  recurrence: RecurrenceType;
  period: dfns.Interval;
  colorMap: Map<string, string>;
  // Figure specific
  invertAxis?: boolean;
  dataLayer?: CustomLayer;
  order?: 'asc' | 'desc';
  value: SubEncoding<'x' | 'y' | 'theta'>;
  label: SubEncoding<'x' | 'y' | 'color'>;
  color?: Encoding['color'];
  dataLabel?: {
    format: 'percent' | 'numeric';
    position?: 'out' | 'in';
    showLabel?: boolean;
    minValue?: number;
  };
};

type ArcRadius = {
  outer: number;
  inner: number;
  center: number;
};

type PartialFigureSpec = {
  layer: Layer[];
  encoding: Encoding;
  data?: unknown[];
};

const { scheme } = config.report;

// Colors of vega (https://vega.github.io/vega/docs/schemes/)
const colorScheme = vegaScheme(scheme) as string[];
// Colors of labels for colors of Vega
const labelScheme = `${scheme}.labels`;
vegaScheme(
  labelScheme,
  colorScheme.map((color) =>
    // oxlint-disable-next-line import/no-named-as-default-member
    chroma.contrast(color, 'black') > 5 ? 'black' : 'white'
  )
);

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
    center: Math.round(innerRadius + (outerRadius - innerRadius) / 2),
  };
}

/**
 * Check if the label of the data is actually a date
 *
 * If more than 3/4 label's data is date, consider whole axis as a date
 *
 * @param data The data to display
 * @param field The path to the date field
 *
 * @returns Is label of data is a date
 */
function isLabelDates(data: FetchResultItem[]): boolean {
  const sample = data.slice(0, data.length / 2);
  const count = sample.reduce((prev: number, { label }) => {
    const labelDate = new Date(ensureInt(label || 'undefined'));
    return prev + (dfns.isValid(labelDate) ? 1 : 0);
  }, 0);

  return count / sample.length > 0.75;
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
  params: VegaParams
): FetchResultItem[] {
  let eachUnitOfInterval;
  switch (params.recurrence) {
    case 'DAILY':
      eachUnitOfInterval = dfns.eachHourOfInterval;
      break;

    case 'WEEKLY':
    case 'MONTHLY':
      eachUnitOfInterval = dfns.eachDayOfInterval;
      break;

    case 'QUARTERLY':
    case 'BIENNIAL':
    case 'YEARLY':
      eachUnitOfInterval = dfns.eachMonthOfInterval;
      break;

    default:
      throw new Error('Recurrence not found');
  }

  const defaultData = eachUnitOfInterval(params.period).map(
    (date): FetchResultItem => {
      const key = new Date(date).getTime();
      return {
        key,
        value: 0,
        label: key,
        z_ezr_dl: '',
      };
    }
  );

  return [...defaultData, ...data];
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
  getLabel = (el: FetchResultItem): FetchResultValue => el.label || ''
): { domain: FetchResultValue[]; range: string[] } | undefined {
  const colorsEntries = new Map<FetchResultValue, string>();
  const unusedColorsSet = new Set(colorScheme);

  const labels = new Set(data.map((el) => getLabel(el)));
  if (labels.size <= 0) {
    return undefined;
  }

  const labelIterator = [...labels];
  for (const label of labelIterator) {
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

const formatPercent = (value: number) =>
  value.toLocaleString('fr-FR', {
    style: 'percent',
    maximumFractionDigits: 2,
  });

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
  valueAxis = 'y'
): { dataLayerEdits: Layer; layers?: Layer[] } {
  const dataLayerEdits = {} as Layer;

  if (!params.dataLabel) {
    return { dataLayerEdits };
  }

  const pos: Record<string, number> = {};
  if (radius?.center) {
    switch (params.dataLabel.position) {
      case 'out': {
        pos.radius = radius.outer - (params.dataLabel.showLabel ? 22 : 11);
        const rad = 0.8 * pos.radius;

        merge(dataLayerEdits, {
          mark: { radius: rad, radius2: rad * RADIUS_OUTER_INNER_RATIO },
        });
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
        field: 'z_ezr_dl',
      },
      // FIXME: WARN Dropping since it does not contain unknown data field, datum, value, or signal.
      color: {
        legend: null,
        scale: {
          // @ts-expect-error
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

    case 'line':
    case 'area':
    case 'bar':
      if (params.color) {
        textAggregate = 'sum';
      }

      merge(layer, {
        encoding: {
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

  // Format data labels
  switch (params.dataLabel.format) {
    case 'percent': {
      const calcSumOfData = (prev: number, item: FetchResultItem) => {
        const value = ensureInt(item.value);
        if (Number.isNaN(value)) {
          return prev;
        }
        return prev + value;
      };

      const minValue = params.dataLabel.minValue ?? 0.03;

      if (!params.color) {
        // Calc sum of values
        const sum = data.reduce(calcSumOfData, 0);

        // Set percentage on each item
        for (const item of data) {
          const value = ensureInt(item.value);
          if (!Number.isNaN(value)) {
            const percentage = value / sum;
            if (percentage >= minValue) {
              item.z_ezr_dl = formatPercent(percentage);
            }
          }

          item.z_ezr_dl = item.z_ezr_dl ?? '';
        }
      } else {
        // Calc sum of colors for each label
        const sumPerLabel = new Map<string, number>();
        for (const item of data) {
          const value = ensureInt(item.value);
          if (Number.isNaN(value)) {
            continue;
          }

          const sum = sumPerLabel.get(`${item.label}`) ?? 0;
          sumPerLabel.set(`${item.label}`, sum + value);
        }

        // Set percentage on each item
        for (const item of data) {
          const sum = sumPerLabel.get(`${item.label}`);
          const value = ensureInt(item.value);
          if (sum && !Number.isNaN(value)) {
            const percentage = value / sum;
            if (percentage >= minValue) {
              item.z_ezr_dl = formatPercent(percentage);
            }
          }

          item.z_ezr_dl = item.z_ezr_dl ?? '';
        }
      }
      break;
    }

    default: {
      let { minValue } = params.dataLabel;
      if (minValue == null) {
        // default to 3% of maximum value
        minValue =
          Math.max(...data.map((item) => ensureInt(item.value)), 0) * 0.03;
      }

      // Set value on each item
      for (const item of data) {
        const value = ensureInt(item.value);
        if (!Number.isNaN(value) && value >= minValue) {
          item.z_ezr_dl = `${value}`;
        }

        item.z_ezr_dl = item.z_ezr_dl ?? '';
      }
      break;
    }
  }

  if (!params.dataLabel.showLabel) {
    return { dataLayerEdits, layers: [layer] };
  }

  const textAggregatePrefix = textAggregate && `${textAggregate}_`;
  // Add label layer
  const labelLayer = {
    mark: merge({}, layer.mark, {
      dy: -7,
      fontWeight: 'normal',
    }),
    encoding: {
      // oxlint-disable-next-line id-length
      y: layer.encoding?.y,
      // oxlint-disable-next-line id-length
      x: layer.encoding?.x,
      text: {
        condition: {
          test: `datum['${textAggregatePrefix}z_ezr_dl'] != ''`,
          field: params.color ? 'color' : 'label',
        },
      },
      color: layer.encoding?.color,
    },
  };

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
  params: VegaParams
): Layer =>
  merge<Layer, CustomLayer | Record<string, never>>(
    {
      mark: {
        type,
        point: true,
      },
    },
    params.dataLayer ?? {}
  );

/**
 * Merge data layer and layers
 *
 * @param dataLayer The layer that contains the data
 * @param layers The layers to merge
 *
 * @returns The layers ready to be used in a vega-lite spec
 */
const mergeLayers = (
  dataLayer: Layer,
  ...layers: (Layer | undefined)[]
): Layer[] => [dataLayer, ...layers.filter((lay): lay is Layer => !!lay)];

type CreateSpecFnc = (
  type: Mark,
  data: FetchResultItem[],
  params: VegaParams
) => PartialFigureSpec;

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
      params.value
    ),
    order: merge<Encoding['order'], VegaParams['value']>(
      { field: 'value', sort: 'descending', type: 'quantitative' },
      params.value
    ),
    color: merge<Encoding['color'], VegaParams['label']>(
      {
        field: 'label',
        scale: prepareColorScale(type, data, params),
        sort: {
          field: 'value',
          order: params.order === 'asc' ? 'ascending' : 'descending',
        },
        legend: { orient: 'top-right' },
      },
      params.label
    ),
  };

  // Prepare data labels
  const { dataLayerEdits, layers: dataLabelLayers = [] } =
    prepareDataLabelsLayers(type, data, params, radius);
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
  const [valueAxis, labelAxis] = (
    params.invertAxis ? ['x', 'y'] : ['y', 'x']
  ) as ('x' | 'y')[];

  const dataLayer = prepareDataLayer(type, data, params);

  // Prepare encoding
  const encoding: Encoding = {
    [valueAxis]: merge<Encoding[typeof valueAxis], VegaParams['value']>(
      { field: 'value', stack: 'zero', type: 'quantitative' },
      params.value
    ),
    [labelAxis]: merge<Encoding[typeof labelAxis], VegaParams['label']>(
      {
        field: 'label',
        type: 'nominal',
        title: null,
        sort: `-${valueAxis}`,
      },
      params.label
    ),
    color: params.color
      ? merge<Encoding['color'], VegaParams['color']>(
          {
            field: 'color',
            scale: prepareColorScale(
              type,
              data,
              params,
              (el) => el.color || ''
            ),
          },
          params.color
        )
      : undefined,
    order: { aggregate: 'count' },
  };

  let editedData;
  if (isLabelDates(data)) {
    const timeFormat = calcVegaFormatFromRecurrence(params.recurrence);

    editedData = prepareDataWithDefaultDates(type, data, params);

    merge<Encoding[typeof labelAxis], Encoding[typeof labelAxis]>(
      encoding[labelAxis],
      {
        timeUnit: timeFormat.timeUnit,
        axis: { format: timeFormat.format },
        sort: 'ascending',
      }
    );
  }

  // Prepare data labels
  const { dataLayerEdits, layers: dataLabelLayers = [] } =
    prepareDataLabelsLayers(type, data, params, undefined, valueAxis);
  merge(dataLayer, dataLayerEdits);

  return {
    layer: mergeLayers(dataLayer, ...dataLabelLayers),
    data: editedData,
    encoding,
  };
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
  // Line charts works essentially as the same as bar charts
  // we just don't allow axis inversion and assume that labels
  const dataLayer = prepareDataLayer(type, data, params);
  const timeFormat = calcVegaFormatFromRecurrence(params.recurrence);

  const sortedData = data.sort(
    (dataA, dataB) => ensureInt(dataA.label ?? 0) - ensureInt(dataB.label ?? 0)
  );

  // Prepare encoding
  const encoding: Encoding = {
    // oxlint-disable-next-line id-length
    y: merge<Encoding['y'], VegaParams['value']>(
      { field: 'value', type: 'quantitative' },
      params.value
    ),
    // oxlint-disable-next-line id-length
    x: merge<Encoding['x'], VegaParams['label']>(
      {
        field: 'label',
        type: 'nominal',
        title: null,
        sort: 'ascending',
        timeUnit: timeFormat.timeUnit,
        axis: { format: timeFormat.format },
      },
      params.label
    ),
    color: params.color
      ? merge<Encoding['color'], VegaParams['color']>(
          {
            field: 'color',
            scale: prepareColorScale(
              type,
              sortedData,
              params,
              (el) => el.color || ''
            ),
          },
          params.color
        )
      : undefined,
    order: { aggregate: 'count' },
  };

  // Prepare data labels
  // TODO: fix line data labels
  // const {
  //   dataLayerEdits,
  //   layers: dataLabelLayers = [],
  // } = prepareDataLabelsLayers(type, data, params, undefined, 'x');
  // merge(dataLayer, dataLayerEdits);

  return {
    // layer: mergeLayers(dataLayer, ...dataLabelLayers),
    layer: [dataLayer],
    data: prepareDataWithDefaultDates(type, sortedData, params),
    encoding,
  };
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
    // oxlint-disable-next-line id-length
    x: merge<Encoding['x'], VegaParams['value']>(
      { field: 'value' },
      params.value
    ),
    // oxlint-disable-next-line id-length
    y: merge<Encoding['y'], VegaParams['label']>(
      { field: 'label' },
      params.label
    ),
    color: params.color
      ? merge<Encoding['color'], VegaParams['color']>(
          { field: 'color', scale: prepareColorScale(type, data, params) },
          params.color
        )
      : undefined,
  };

  // Prepare data labels
  const { dataLayerEdits, layers: dataLabelLayers = [] } =
    prepareDataLabelsLayers(type, data, params);
  merge(dataLayer, dataLayerEdits);

  return { layer: mergeLayers(dataLayer, ...dataLabelLayers), encoding };
};
