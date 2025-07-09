import { merge } from 'lodash';
import type { Mark } from 'vega-lite/types_unstable/mark.js';

import type { RecurrenceType } from '@ezreeport/models/recurrence';
import type { FigureType } from '@ezreeport/models/templates';
import type { FetchResultItem } from '~/models/fetch/results';
import type { PDFReport } from '~/models/render/pdf/types';
import type { Area } from '~/models/render/types';

import RenderError from './errors';
import { addMdToPDF } from './pdf/markdown';
import { addMetricToPDF } from './pdf/metrics';
import { addTableToPDF } from './pdf/table';
import { createVegaLSpec, createVegaView, parseTitle } from './vega';

type RenderFigureFnc = (params: {
  /**
   * The report document
   */
  doc: PDFReport,
  /**
   * The color map keeping track of used colors
   */
  colorMap: Map<string, string>,
  /**
   * The figure
   */
  figure: FigureType,
  /**
   * Page's viewport
   */
  viewport: Area,
  /**
   * Current slot
   */
  slot: Area,
  /**
   * Data to render
   */
  data: FetchResultItem[],
  /**
   * Recurrence of the report
   */
  recurrence: RecurrenceType,
  order?: 'asc' | 'desc',
}) => Promise<void>;

/**
 * Render a table
 *
 * @param params
 */
const renderTable: RenderFigureFnc = async (params) => {
  const {
    doc,
    figure,
    viewport,
    slot,
    data,
  } = params;

  const margin: Partial<Record<'top' | 'right' | 'bottom' | 'left', number>> = {};
  figure.params.tableWidth = slot.width;

  figure.params.startY = slot.y;
  if (slot.x !== viewport.x) {
    margin.left = slot.x;
  }

  figure.params.maxHeight = slot.height;

  await addTableToPDF(doc, data, merge({}, figure.params, { margin }));
};

/**
 * Render a markdown
 *
 * @param params
 */
const renderMarkdown: RenderFigureFnc = async (params) => {
  const {
    doc,
    figure,
    slot,
    data,
  } = params;

  if (!data.toString) {
    throw new RenderError(
      'Provided data is not string compatible',
      'DataTypeError',
    );
  }

  await addMdToPDF(doc, data.toString(), {
    ...figure.params,
    start: {
      x: slot.x,
      y: slot.y,
    },
    width: slot.width,
    height: slot.height,
  });
};

/**
 * Render metrics
 *
 * @param params
 */
const renderMetrics: RenderFigureFnc = async (params) => {
  const {
    doc,
    figure,
    slot,
    data,
  } = params;

  addMetricToPDF(doc, data, {
    ...figure.params,
    start: {
      x: slot.x,
      y: slot.y,
    },
    width: slot.width,
    height: slot.height,
  });
};

/**
 * Render a table
 *
 * @param params
 */
const renderVegaChart: RenderFigureFnc = async (params) => {
  const {
    doc,
    colorMap,
    figure,
    slot,
    data,
    recurrence,
  } = params;

  // Figure title
  const { title: vegaTitle, ...figParams } = figure.params;
  if (vegaTitle) {
    const fontSize = doc.pdf.getFontSize();
    const font = doc.pdf.getFont();

    const text = parseTitle(vegaTitle, data);

    doc.pdf
      .setFont(doc.fontFamily, 'bold')
      .setFontSize(10);

    const { h } = doc.pdf.getTextDimensions(
      Array.isArray(text) ? text.join('\n') : text,
      { maxWidth: slot.width },
    );

    doc.pdf
      .text(text, slot.x, slot.y + h, { maxWidth: slot.width })
      .setFontSize(fontSize)
      .setFont(font.fontName, font.fontStyle);

    slot.y += (1.25 * h);
    slot.height -= (1.25 * h);
  }

  const spec = createVegaLSpec(
    figure.type as Mark,
    data,
    {
      ...(figParams as { label: any, value: any }),
      colorMap,
      recurrence,
      period: doc.period,
      width: slot.width,
      height: slot.height,
    },
  );

  const view = await Promise.resolve(createVegaView(spec))
    .catch((err) => new RenderError(
      err.message,
      'VegaError',
      { vegaSpec: { ...spec, datasets: undefined } },
    ));

  if (view instanceof Error) {
    throw view;
  }

  doc.pdf.addImage({
    ...slot,
    // jsPDF only supports PNG, TIFF, JPG, WEBP & BMP meanwhile
    // Vega can only export to Canvas (with typings issues), SVG & PNG
    imageData: await view.toImageURL('png', 1.5),
  });
};

/**
 * Render a figure based on its type into the PDF report
 *
 * @param params
 *
 * @returns Promise until the figure is rendered
 */
const renderFigure: RenderFigureFnc = (params) => {
  let render = renderVegaChart;
  switch (params.figure.type) {
    case 'table':
      render = renderTable;
      break;

    case 'md':
      render = renderMarkdown;
      break;

    case 'metric':
      render = renderMetrics;
      break;

    default:
      break;
  }

  return render(params);
};

export default renderFigure;
