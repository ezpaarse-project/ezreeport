import { registerFont } from 'canvas';
import { writeFile } from 'fs';
import type { ImageOptions } from 'jspdf';
import { cloneDeep, merge, omit } from 'lodash';
import { join } from 'path';
import {
  expressionFunction,
  Locale as VegaLocale,
  parse,
  scheme,
  View
} from 'vega';
import { compile, type TopLevelSpec } from 'vega-lite';
import type { Mark, MarkDef } from 'vega-lite/build/src/mark';
import type { UnitSpec } from 'vega-lite/build/src/spec';
import config from '../config';
import logger from '../logger';
import type { PDFReport, PDFReportOptions } from '../pdf';
import type { TableParams } from '../pdf/table';
import localeFR from './locales/fr-FR.json';
import VegaLogger from './logger';

const rootPath = config.get('rootPath');
const { outDir } = config.get('pdf');

registerFont('lib/vega/fonts/Roboto-light.ttf', { family: 'Roboto', weight: 'normal' });
registerFont('lib/vega/fonts/Roboto-medium.ttf', { family: 'Roboto', weight: 'bold' });
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

// TODO[type]: Rework types (no more any)

/**
 * Params for createVegaLSpec
 */
type Layer = UnitSpec<string>;
type Title = Exclude<Layer['title'], undefined>;
type Encoding = Exclude<Layer['encoding'], undefined>;
// Hide 'mark.type' property
type CustomLayer = Omit<Layer, 'mark'> & { mark: Omit<Layer['mark'], 'type'> };

type VegaParams = {
  /**
   * Width of the graph, should match PDF viewport
   */
  width: number;
  /**
   * Width of the graph, should match PDF viewport
   */
  height: number;
  debugExport?: boolean,
  dataLayer?: CustomLayer;
  value: Exclude<Encoding['x' | 'y' | 'theta'], undefined | null> & { field: string };
  label: Exclude<Encoding['x' | 'y' | 'color'], undefined | null> & { field: string },
  color?: Encoding['color'] & { field: string },
  title: Title,
  dataLabel?: {
    format: 'percent' | 'numeric',
    showLabel?: boolean
    minValue?: number,
  }
};

export type InputVegaParams = Omit<VegaParams, 'width' | 'height'>;

/**
 * Figure definition
 */
export interface VegaFigure<Type extends Mark | 'table'> {
  type: Type;
  data: any;
  params: Type extends Mark ? InputVegaParams : TableParams;
}

/**
 * Global figure definition
 */
type AnyVegaFigure = VegaFigure<Mark> | VegaFigure<'table'>;

type AnyVegaFigureFnc = (
  docOpts: PDFReportOptions,
  dataOpts: any
) => AnyVegaFigure | AnyVegaFigure[];

export type LayoutVegaFigure = Array<AnyVegaFigureFnc | Promisify<AnyVegaFigureFnc>>;

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
  data: any[],
  params: VegaParams,
): TopLevelSpec => {
  const layers: Layer[] = [];
  // Adding default layer
  const dataLayer = merge<Layer, CustomLayer | {}>(
    {
      mark: {
        type,
        point: true,
        radius2: params.height / 5,
      },
    },
    params.dataLayer ?? {},
  );
  layers.push(dataLayer);

  // Getting default encoding
  let encoding: Encoding = {
    color: {
      scale: {
        // Default colors of Vega (https://vega.github.io/vega/docs/schemes/)
        scheme: 'tableau10',
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
          ...params.label,
        },
      });
      break;

    case 'bar':
      encoding = merge<Encoding, Encoding>(encoding, {
        y: {
          stack: 'zero',
          type: 'quantitative',
          ...params.value,
        },
        x: {
          type: 'nominal',
          ...params.label,
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
    const dLLayer: Layer = {
      mark: {
        type: 'text',
        align: 'center',
        baseline: 'top',
        dy: 5,
        radius: type === 'arc' ? (params.height ?? 0) / 2.9 : undefined,
      },
      encoding: {
        text: {
        },
        // FIXME: "WARN Dropping {"legend":null,"scale":{"scheme":"tableau10-labels"}} from channel "color" since it does not contain any data field, datum, value, or signal."
        color: {
          legend: null,
          scale: {
            scheme: 'tableau10-labels',
          },
        },
      },
    };

    // Format datalabels
    let condition: string | undefined;
    let format: ((v: string) => string) | undefined;
    switch (params.dataLabel.format) {
      case 'percent': {
        const totalDocs = data.reduce((prev, value) => prev + value[params.value.field], 0);
        const minValue = params.dataLabel.minValue ?? 0.02;
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
    // Adding condition to datalabels
    if (dLLayer.encoding?.text) {
      // @ts-ignore
      dLLayer.encoding.text.condition = {
        test: condition ?? 'true',
        ...params.value,
      };
    }

    // Showing label if needed
    if (params.dataLabel.showLabel) {
      layers.push({
        mark: merge(cloneDeep(dLLayer.mark), {
          dy: -7,
        }),
        encoding: {
          text: {
            condition: {
              test: condition ?? 'true',
              field: params.label.field,
            },
          },
          color: dLLayer.encoding?.color,
        },
      });
      (dLLayer.mark as MarkDef<'text'>).fontWeight = 'bold';
    }

    if (format) {
      expressionFunction('dataLabelFormat', format);
      (dLLayer.encoding?.text?.condition as any).format = '';
      (dLLayer.encoding?.text?.condition as any).formatType = 'dataLabelFormat';
    }

    layers.push(dLLayer);
  }

  const spec: TopLevelSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: params.width,
    height: params.height,
    background: 'transparent',
    title: merge<TopLevelSpec['title'], TopLevelSpec['title'] | {}>(
      {
        text: '',
        anchor: 'start',
        dy: -5,
      },
      params.title,
    ),
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
  if (params.debugExport === true) {
    writeFile(
      join(rootPath, outDir, 'debug.json'),
      JSON.stringify(omit(spec, 'datasets'), undefined, 4),
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
export const addVega = async (
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

/**
 * Check if the given figure is a table
 *
 * @param figure The figure
 * @returns Is the figure is a table
 */
export const isFigureTable = (figure: AnyVegaFigure): figure is VegaFigure<'table'> => figure.type === 'table';
