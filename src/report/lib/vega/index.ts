import { writeFile } from 'fs';
import type { ImageOptions } from 'jspdf';
import { merge, omit, pick } from 'lodash';
import { join } from 'path';
import {
  expressionFunction,
  Locale as VegaLocale,
  parse,
  View
} from 'vega';
import { compile, type TopLevelSpec } from 'vega-lite';
import type { Mark } from 'vega-lite/build/src/mark';
import type { LayerSpec, UnitSpec } from 'vega-lite/build/src/spec';
import config from '../config';
import logger from '../logger';
import type { PDFReport, PDFReportOptions } from '../pdf';
import type { TableParams, TableParamsFnc } from '../pdf/table';
import localeFR from './locales/fr-FR.json';

const rootPath = config.get('rootPath');
const { outDir } = config.get('pdf');

type LayerType = LayerSpec<any> | UnitSpec<any>;

type FormatFnc = (v: number | string) => string;

// TODO[type]: Rework types (no more any)

/**
 * Params for createVegaLSpec
 */
interface VegaParams {
  /**
   * Title of the graph
   */
  title: Exclude<TopLevelSpec['title'], undefined>;
  /**
   * Vega-lite spec with some limitations
   */
  spec: Omit<TopLevelSpec, 'type' | 'datasets' | 'data'> & { encoding: LayerType['encoding'] };
  /**
   * Width of the graph, should match PDF viewport
   */
  width?: number;
  /**
   * Width of the graph, should match PDF viewport
   */
  height?: number;
  /**
   * Should show datalabels or not
   */
  dataLabel?:
  | true
  | {
    /**
     * Spec of the layer
     */
    spec: Omit<LayerType, 'mark'> & { mark?: any };
    /**
     * Custom formatter
     */
    format?: FormatFnc | 'percent' | { type: 'percent', minValue?: number };
  };
  /**
   * Spec of the data layer
   */
  dataLayer?: Omit<LayerType, 'mark'>;
  /**
   * Should export generated spec (without data) to debug file ?
   */
  debugExport?: boolean;
}

/**
 * Figure definition
 */
export interface VegaFigure<Type extends Mark | 'table'> {
  type: Type;
  data: any;
  params: Type extends Mark ? VegaParams : TableParams | TableParamsFnc | Promisify<TableParamsFnc>;
}

/**
 * Global figure definition
 */
type AnyVegaFigure = VegaFigure<Mark> | VegaFigure<'table'>;

type AnyVegaFigureFnc = (
  docOpts: PDFReportOptions,
  dataOpts: any
) => AnyVegaFigure;

export type LayoutVegaFigure = Array<AnyVegaFigureFnc | Promisify<AnyVegaFigureFnc>>;

/**
 * Helper to create Vega-lite spec
 *
 * Some values are by default :
 * - Datalabels default to Y values
 * - Default locale is fr-FR
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
  // TODO[feat]: Merge with whole params.spec ?

  const spec: TopLevelSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: params.width,
    height: params.height,
    background: 'transparent',
    title: merge<TopLevelSpec['title'], TopLevelSpec['title'] | {}>(
      {
        text: typeof params.title !== 'object' ? params.title : '',
        anchor: 'start',
        dy: -5,
        // FIXME: Font needs to be installed
        font: 'Roboto',
        fontWeight: 400,
      },
      typeof params.title === 'object' ? params.title : {},
    ),
    // Adding data
    datasets: {
      default: data,
    },
    data: { name: 'default' },
    // Allow specific color for specific layers
    resolve: merge<TopLevelSpec['resolve'], TopLevelSpec['resolve'] | {}>(
      {
        scale: {
          color: 'independent',
        },
      },
      typeof params.spec?.resolve === 'object' ? params.spec.resolve : {},
    ),
    layer: [
      // Default layer with the main chart
      merge<LayerType, LayerType | {}>(
        { mark: { type, point: true, radius2: (params.height ?? 0) / 5 } },
        params.dataLayer ?? {},
      ),
    ],
    encoding: merge<LayerType['encoding'], LayerType['encoding']>(
      {
        color: {
          scale: {
            // Default colors of Vega (usefull for reference or datalabels)
            range: [
              '#4c78a8', // blue
              '#f58518', // orange
              '#e45756', // red
              '#72b7b2', // cyan
              '#54a24b', // green
              '#eeca3b', // yellow
              '#b279a2', // purple
              '#ff9da6', // pink
              '#9d755d', // brown
              '#bab0ac', // grey
            ],
          },
        },
      },
      params.spec.encoding,
    ),
    config: {
      locale: params.spec.config?.locale ?? (localeFR as VegaLocale),
      customFormatTypes: true,
    },
  };

  // FIXME: correctly guess value
  const yField = spec.encoding?.y ?? spec.layer[0].encoding?.y;
  // const xField = spec.encoding?.x ?? spec.layer[0].encoding?.x;

  if (params.dataLabel) {
    const dLLayer = merge<LayerType, LayerType | {}>(
      // Default config for data labels
      {
        mark: {
          type: 'text',
          align: 'center',
          baseline: 'top',
          dy: 5,
          radius: type === 'arc' ? (params.height ?? 0) / 2.9 : undefined,
        },
        encoding: {
          text: {
            field: (yField as any)?.field,
            type: (yField as any)?.type,
            aggregate: (yField as any)?.aggregate,
          },
          color: {
            // Get some fields of global color encoding
            ...(params.spec.encoding?.color != null
              ? pick(params.spec.encoding.color, 'field', 'type')
              : {}),
            // @ts-expect-error
            legend: null,
            scale: {
              // Based on default Vega colors
              range: [
                'white', // white on blue
                'black', // black on orange
                'white', // white on red
                'black', // black on cyan
                'black', // black on green
                'black', // black on yellow
                'black', // black on purple
                'black', // black on pink
                'white', // white on brown
                'black', // black on grey
              ],
            },
          },
        },
      },
      typeof params.dataLabel === 'object' ? params.dataLabel.spec : {},
    );

    // Resolve custom format
    if (
      typeof params.dataLabel === 'object'
      && dLLayer.encoding?.text != null
    ) {
      const dlParams = params.dataLabel;
      const { field } = dLLayer.encoding.text as any;

      // Prefine percent format
      if (
        dlParams.format === 'percent'
        || (typeof dlParams.format !== 'function' && dlParams.format?.type === 'percent')
      ) {
        const totalDocs = data.reduce((prev, value) => prev + value[field], 0);
        const minValue = typeof dlParams.format === 'object' && dlParams.format.minValue
          ? dlParams.format.minValue
          : 0.02;

        dlParams.format = (v) => {
          const perc = +v / totalDocs;
          return perc >= minValue
            ? perc.toLocaleString('fr-FR', { style: 'percent', maximumFractionDigits: 2 })
            : '';
        };
      }

      if (typeof dlParams.format === 'function') {
        expressionFunction('dataLabelFormat', params.dataLabel.format);
        (dLLayer.encoding.text as any).format = '';
        (dLLayer.encoding.text as any).formatType = 'dataLabelFormat';
      }
    }

    spec.layer.push(dLLayer);
  }

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
export const createVegaView = (spec: TopLevelSpec): View => new View(parse(compile(spec).spec), { renderer: 'none' });

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
