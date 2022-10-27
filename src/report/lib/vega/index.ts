import { writeFile } from 'fs';
import type { ImageOptions } from 'jspdf';
import { merge, omit, pick } from 'lodash';
import {
  // eslint-disable-next-line @typescript-eslint/comma-dangle
  expressionFunction, Locale as VegaLocale, parse, View
} from 'vega';
import { compile, type TopLevelSpec } from 'vega-lite';
import type { Mark } from 'vega-lite/build/src/mark';
import type { LayerSpec, UnitSpec } from 'vega-lite/build/src/spec';
import logger from '../logger';
import type { PDFReport, PDFReportOptions } from '../pdf';
import type { TableParams, TableParamsFnc } from '../pdf/table';
import localeFR from './locales/fr-FR.json';

type LayerType = LayerSpec<any> | UnitSpec<any>;

/**
 * Params for createVegaLSpec
 */
export interface VegaParams {
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
    spec: Omit<LayerType, 'mark'> & { mark?: any }; // TODO: FIX
    /**
     * Custom formatter
     */
    format?: (v: number | string) => string;
  };
  /**
   * Spec of the data layer
   */
  dataLayer?: Omit<LayerType, 'mark'>;
  /**
   * Should export generated spec (without data) to `/dist/debug.json` ?
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
export type AnyVegaFigure = VegaFigure<Mark> | VegaFigure<'table'>;

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
  data: any,
  params: VegaParams,
): TopLevelSpec => {
  // TODO: Merge with whole params.spec ?
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
        // TODO! Font needs to be installed
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
        { mark: { type, point: true } },
        params.dataLayer ?? {},
      ),
    ],
    encoding: merge<LayerType['encoding'], LayerType['encoding']>(
      {},
      params.spec.encoding,
    ),
    config: {
      locale: params.spec.config?.locale ?? (localeFR as VegaLocale),
    },
  };

  // TODO correctly guess value
  const yField = spec.encoding?.y ?? spec.layer[0].encoding?.y;
  // const xField = spec.encoding?.x ?? spec.layer[0].encoding?.x;

  if (params.dataLabel !== undefined) {
    // TODO: Colors, cf. vega colors (in chart.js)
    const dLLayer = merge<LayerType, LayerType | {}>(
      {
        mark: {
          type: 'text',
          align: 'center',
          baseline: 'top',
          dy: 5,
        },
        encoding: {
          text: {
            field: (yField as any)?.field,
            type: (yField as any)?.type,
            aggregate: (yField as any)?.aggregate,
          },
          color: {
            ...(params.spec.encoding?.color != null
              ? pick(params.spec.encoding.color, 'field', 'type')
              : {}),
            // @ts-expect-error
            legend: null,
            scale: { range: ['black'] },
          },
        },
      },
      typeof params.dataLabel === 'object' ? params.dataLabel.spec : {},
    );

    // Resolve custom format
    if (
      typeof params.dataLabel === 'object'
      && typeof params.dataLabel.format === 'function'
      && dLLayer.encoding?.text != null
    ) {
      expressionFunction('dataLabelFormat', params.dataLabel.format);
      (dLLayer.encoding.text as any).format = '';
      (dLLayer.encoding.text as any).formatType = 'dataLabelFormat';
    }

    spec.layer.push(dLLayer);
  }

  if (params.debugExport === true) {
    writeFile(
      'dist/debug.json',
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
