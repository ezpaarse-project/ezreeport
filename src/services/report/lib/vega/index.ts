import { writeFile } from 'node:fs';
import { join } from 'node:path';

import { registerFont } from 'canvas';
import { compile as handlebars } from 'handlebars';
import type { ImageOptions } from 'jspdf';
import {
  cloneDeep,
  get,
  merge,
  omit,
} from 'lodash';

import {
  expressionFunction,
  Locale as VegaLocale,
  parse,
  scheme,
  View,
} from 'vega';
import { compile, type TopLevelSpec } from 'vega-lite';
import type { Mark } from 'vega-lite/build/src/mark';
import type { UnitSpec } from 'vega-lite/build/src/spec';

import { Recurrence } from '~/lib/prisma';
import config from '~/lib/config';
import { appLogger as logger } from '~/lib/logger';
import type { PDFReport } from '~/lib/pdf';
import { calcVegaFormat } from '~/models/recurrence';

import localeFR from './locales/fr-FR.json';
import VegaLogger from './logger';

const { outDir } = config.report;

registerFont('lib/vega/fonts/Roboto-light.ttf', { family: 'Roboto', weight: 'normal' });
registerFont('lib/vega/fonts/Roboto-medium.ttf', { family: 'Roboto', weight: 'bold' });
// Default colors of vega
const colorScheme = scheme('tableau10') as string[];
// Default colors of labels for default colors of Vega (https://vega.github.io/vega/docs/schemes/)
scheme('tableau10-labels', [
  'white', // white on blue
  'black', // black on orange
  'black', // black on red
  'black', // black on cyan
  'black', // black on green
  'black', // black on yellow
  'black', // black on purple
  'black', // black on pink
  'white', // white on brown
  'black', // black on grey
]);

/**
 * Params for createVegaLSpec
 */
type Layer = UnitSpec<string>;
type Title = Exclude<Layer['title'], undefined>;
type Encoding = Exclude<Layer['encoding'], undefined>;
type SubEncoding<T extends keyof Encoding> = Exclude<Encoding[T], undefined | null>;
// Hide 'mark.type' property for overriding it
type CustomLayer = Omit<Layer, 'mark'> & { mark: Omit<Layer['mark'], 'type'> };

type VegaParams = {
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
  colorMap: Map<string, string>,
  // Figure specific
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

export type InputVegaParams = Omit<VegaParams, 'width' | 'height'> & { title: Title };

/**
 * Ratio between outer and inner radius.
 * Higher means thinner, lower means wider
 */
const RADIUS_OUTER_INNER_RATIO = 0.5;

/**
 * Parse given title with handlebars vars. It's weird because Vega's title can be a lot of things
 *
 * @param title The Vega title
 * @param inputData The data given to the figure
 * @param dataKey The optional key to access data
 *
 * @returns The title to print
 */
export const parseTitle = (
  title: Title,
  inputData: Record<string, any[]> | any[],
  dataKey?: string,
): string | string[] => {
  let data = [];
  if (Array.isArray(inputData)) {
    data = inputData;
  } else {
    if (!dataKey) {
      throw new Error('Unable to parse title: data is not iterable, and no "dataKey" is present');
    }
    data = inputData[dataKey];
  }

  const handlebarsOpts = { length: data.length };
  if (typeof title === 'string') {
    return handlebars(title)(handlebarsOpts);
  }
  if (Array.isArray(title)) {
    return title.map((t) => handlebars(t)(handlebarsOpts));
  }
  if (typeof title?.text === 'string') {
    return handlebars(title.text)(handlebarsOpts);
  }
  if (Array.isArray(title?.text)) {
    return title.text.map((t) => handlebars(t)(handlebarsOpts));
  }
  throw new Error('Unable to parse title: this format of params is not supported');
};

/**
 * Helper to create Vega-lite spec
 *
 * @param type Type of graph
 * @param data The data
 * @param params Graph options
 * @returns
 */
export const createVegaLSpec = (
  type: Mark,
  inputData: Record<string, any[]> | any[],
  params: VegaParams,
): TopLevelSpec => {
  let data = inputData as any[];
  if (!Array.isArray(inputData)) {
    if (!params.dataKey) {
      throw new Error('data is not iterable, and no "dataKey" is present');
    }

    if (!Array.isArray(inputData[params.dataKey])) {
      throw new Error(`data.${params.dataKey} is not iterable`);
    }

    data = inputData[params.dataKey];
  }

  // Calculating arc radius if needed
  let radius: { outer: number, inner: number, center: number } | undefined;
  if (type === 'arc') {
    const outer = Math.min(params.height, params.width) / 2;
    const inner = outer * RADIUS_OUTER_INNER_RATIO;

    radius = {
      outer,
      inner,
      center: inner + ((outer - inner) / 2),
    };
  }

  const timeFormat = calcVegaFormat(params.recurrence);

  const layers: Layer[] = [];
  // Adding default layer
  const dataLayer = merge<Layer, CustomLayer | {}>(
    {
      mark: {
        type,
        point: true,
        radius: radius?.outer,
        radius2: radius?.inner,
      },
    },
    params.dataLayer ?? {},
  );
  layers.push(dataLayer);

  // Parsing labels to get correct colors
  const colorsEntries = data.map((d, i): [string, string] => {
    const key = get(d, params.label.field);
    let color = params.colorMap.get(key);
    if (!color) {
      color = colorScheme[i % colorScheme.length];
      params.colorMap.set(key, color);
    }
    return [key, color];
  });

  // Getting default encoding
  let encoding: Encoding = {
    color: {
      scale: {
        domain: colorsEntries.map(([key]) => key),
        range: colorsEntries.map(([, color]) => color),
      },
    },
  };
  switch (type) {
    case 'arc':
      encoding = merge<Encoding, Encoding>(encoding, {
        theta: {
          stack: true,
          type: 'quantitative',
          ...params.value,
        },
        order: {
          // @ts-ignore
          sort: 'descending',
          // @ts-ignore
          type: 'quantitative',
          ...params.value,
        },
        color: {
          // @ts-ignore
          sort: {
            // @ts-ignore
            field: params.value.field,
            // @ts-ignore
            order: params.value.order ?? 'descending',
          },
          // @ts-ignore
          legend: params.label.legend ?? {},
          ...params.label,
        },
      });

      // Default label params
      if (
        encoding.color
        && 'legend' in encoding.color
        && encoding.color.legend
      ) {
        encoding.color.legend = {
          orient: 'top-right',
          ...encoding.color.legend,
        };
      }
      break;

    case 'bar':
      encoding = merge<Encoding, Encoding>(encoding, {
        y: {
          stack: 'zero',
          type: 'quantitative',
          ...params.value,
        },
        x: {
          // @ts-ignore
          type: 'nominal',
          timeUnit: timeFormat.timeUnit,
          ...params.label,
          // @ts-expect-error
          title: params.label.title || null,
          axis: {
            format: timeFormat.format,
            // @ts-ignore
            ...params.label.axis,
          },
        },
        color: {
          ...params.color,
        },
      });
      break;

    default:
      break;
  }

  // Adding datalabels
  if (params.dataLabel) {
    const pos: Record<string, number> = {};
    switch (params.dataLabel.position) {
      case 'out':
        if (radius?.center) {
          pos.radius = radius.outer - (params.dataLabel.showLabel ? 22 : 11);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mark = dataLayer.mark as any;

          mark.radius = 0.8 * pos.radius;
          mark.radius2 = mark.radius * RADIUS_OUTER_INNER_RATIO;
        }
        break;

      case 'in':
      default:
        if (radius?.center) {
          pos.radius = radius.center;
        }
        break;
    }

    // Format datalabels and prepare condition
    let condition: string | undefined;
    let format: ((v: string) => string) | undefined;
    switch (params.dataLabel.format) {
      case 'percent': {
        const totalDocs = data.reduce((prev, value) => prev + get(value, params.value.field), 0);
        const minValue = params.dataLabel.minValue ?? 0.03;
        condition = `datum['${params.value.field}'] / ${totalDocs} >= ${minValue}`;

        format = (v) => {
          const perc = +v / totalDocs;
          return perc.toLocaleString('fr-FR', { style: 'percent', maximumFractionDigits: 2 });
        };
        break;
      }

      default: {
        if (params.dataLabel.minValue) {
          const { minValue } = params.dataLabel;
          condition = `datum['${params.value.field}'] >= ${minValue}`;
        }
        break;
      }
    }

    if (format) {
      expressionFunction('dataLabelFormat', format);
    }

    const dLLayer: Layer = {
      mark: {
        type: 'text',
        align: 'center',
        baseline: 'middle',
        dy: params.dataLabel.showLabel ? 7 : undefined,
        radius: type === 'arc' ? pos.radius : undefined,
        fontWeight: params.dataLabel.showLabel ? 'bold' : undefined,
      },
      encoding: {
        text: {
          condition: {
            test: condition ?? 'true',
            format: format ? '' : undefined,
            formatType: format ? 'dataLabelFormat' : undefined,
            aggregate: type === 'bar' ? 'sum' : undefined,
            field: params.value.field,
          },
        },
        y: type === 'bar' ? {
          aggregate: 'sum',
          field: params.value.field,
          bandPosition: 0.5,
        } : undefined,
        // FIXME: WARN Dropping since it does not contain any data field, datum, value, or signal.
        color: {
          legend: null,
          scale: {
            // @ts-ignore
            scheme: 'tableau10-labels',
          },
        },
        detail: params.color && {
          field: params.color.field,
        },
      },
    };

    // Showing label if needed
    if (params.dataLabel.showLabel) {
      const field = params.color?.field || params.label.field;
      layers.push({
        mark: merge(
          cloneDeep(dLLayer.mark),
          {
            dy: -7,
            fontWeight: 'normal',
          },
        ),
        encoding: {
          y: dLLayer.encoding?.y,
          text: {
            condition: {
              test: condition ?? 'true',
              field,
            },
            // bandPosition: 0.5,
          },
          color: dLLayer.encoding?.color,
        },
      });
    }

    layers.push(dLLayer);
  }
  const spec: TopLevelSpec = {
    width: params.width,
    height: params.height,
    background: 'transparent',
    // Adding data
    datasets: {
      default: data,
    },
    data: { name: 'default' },
    layer: layers,
    encoding,
    config: {
      locale: localeFR as VegaLocale,
      customFormatTypes: true,
      font: 'Roboto',
    },
  };

  // Write generated spec into debug file (without data to gain time & space)
  if (params.debugExport === true && process.env.NODE_ENV !== 'production') {
    spec.$schema = 'https://vega.github.io/schema/vega-lite/v5.json';
    writeFile(
      join(outDir, 'debug.json'),
      JSON.stringify(omit(spec, 'datasets'), undefined, 2),
      'utf-8',
      (err) => {
        if (err != null) {
          logger.error("[vega] Can't write debug :", err);
        }
      },
    );
  }

  return spec;
};

/**
 * Transform a Vega-lite spec into a Vega view. Usefull when rendering.
 *
 * @param spec The Vega-lite spec
 * @returns The vega View
 */
export const createVegaView = (spec: TopLevelSpec): View => new View(parse(compile(spec).spec), { renderer: 'none' }).logger(new VegaLogger());

/**
 * Shorthand to add a Vega View to the PDF
 *
 * @param doc The report
 * @param fig The Vega View
 * @param options Specific options
 */
export const addVegaToPDF = async (
  doc: PDFReport | undefined,
  fig: View,
  options: Omit<ImageOptions, 'imageData'>,
): Promise<void> => {
  if (doc === undefined) throw new Error('jsDoc not initialized');

  doc.pdf.addImage({
    ...options,
    // jsPDF only supports PNG, TIFF, JPG, WEBP & BMP meanwhile
    // Vega can only export to Canvas (with typings issues), SVG & PNG
    imageData: await fig.toImageURL('png', 1.5),
  });
};
