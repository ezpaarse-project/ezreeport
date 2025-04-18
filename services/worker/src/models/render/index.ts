import EventEmitter from 'node:events';

import type { RecurrenceType } from '@ezreeport/models/recurrence';
import type { FigureType, LayoutType, TemplateBodyGridType } from '@ezreeport/models/templates';
import type { ReportPeriodType } from '@ezreeport/models/reports';
import { appLogger } from '~/lib/logger';

import type { Area, Margin } from './types';
import { generateSlots, resolveSlot } from './slots';
import renderFigure from './figures';
import { createPDF, initPDFEngine } from './pdf';
import { drawAreaRef } from './pdf/utils';
import type { PDFReport, PDFResult } from './pdf/types';
import { initVegaEngine } from './vega';
import RenderError from './errors';

export async function initRenderEngine() {
  const start = process.uptime();

  await initPDFEngine();
  initVegaEngine();

  appLogger.info({
    scope: 'render-engine',
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}

export interface RenderEventMap extends Record<string, unknown[]> {
  'render:slots': [slots: Area[]];
  'render:figure': [figure: FigureType];
  'render:layout': [layout: LayoutType];
}

type FigureRenderOptionsType = {
  figure: FigureType;
  slot: Area;
  grid: TemplateBodyGridType;
  viewport: Area;
  margin: Margin;
  debug: boolean;
  colorMap: Map<string, string>;
  recurrence: RecurrenceType;
};

async function renderFigureWithVega(
  doc: PDFReport,
  options: FigureRenderOptionsType,
) {
  if (options.debug) {
    drawAreaRef(doc.pdf, options.slot);
  }

  if (!options.figure.data) {
    throw new RenderError('No data found', 'EmptyDataError');
  }

  let order;
  if (options.figure.params.order !== false) {
    order = options.figure.params.order === true ? 'desc' : options.figure.params.order;
  }

  // eslint-disable-next-line no-await-in-loop
  await renderFigure({
    doc,
    colorMap: options.colorMap,
    figure: options.figure,
    viewport: options.viewport,
    slot: options.slot,
    order,
    data: options.figure.data,
    recurrence: options.recurrence,
  });
}

type LayoutRenderOptionsType = {
  layout: LayoutType;
  slots: Area[];
  grid: TemplateBodyGridType;
  viewport: Area;
  margin: Margin;
  debug: boolean;
  colorMap: Map<string, string>;
  recurrence: RecurrenceType;
};

async function renderLayoutWithVega(
  doc: PDFReport,
  options: LayoutRenderOptionsType,
  events: EventEmitter<RenderEventMap>,
) {
  const { figures } = options.layout;
  // Limit number of figures to the number of possible slots
  figures.length = Math.min(figures.length, options.slots.length);

  for (let figureIndex = 0; figureIndex < figures.length; figureIndex += 1) {
    const { figure, slot } = resolveSlot(
      options.slots,
      figures,
      figureIndex,
      options.grid,
      options.viewport,
      options.margin,
    );

    try {
      // eslint-disable-next-line no-await-in-loop
      await renderFigureWithVega(doc, {
        ...options,
        figure,
        slot,
      });
    } catch (err) {
      if (err instanceof Error) {
        const cause = err.cause ?? {};
        err.cause = { ...cause, figure: figureIndex };
        throw err;
      }
      throw new RenderError(`${err}`);
    }

    events.emit('render:figure', figure);
  }
}

export type VegaRenderOptionsType = {
  doc: {
    name: string;
    period: ReportPeriodType;
    namespace: {
      name: string;
    };
  };
  recurrence: RecurrenceType;
  debug: boolean;
  layouts: LayoutType[];
  grid: TemplateBodyGridType;
};

/**
 * Generate PDF report with Vega
 *
 * @param options The options of renderer
 * @param events Event handler
 *
 * @fires #render:slots When base slots are generated.
 * @fires #render:figure When figure is added in a slot.
 * @fires #render:layout When a layout is rendered.
 *
 * @return Stats about PDF
 */
export async function renderPdfWithVega(
  options: VegaRenderOptionsType,
  events = new EventEmitter<RenderEventMap>(),
): Promise<PDFResult> {
  const colorMap = new Map<string, string>();

  const doc = await createPDF(options.doc);

  /**
     * Usage space in page
     */
  const viewport: Area = {
    x: doc.margin.left,
    y: doc.offset.top,
    width: doc.width - doc.margin.left - doc.margin.right,
    height: doc.height - doc.offset.top - doc.offset.bottom,
  };
  const slotMargin: Margin = {
    horizontal: doc.margin.left,
    vertical: doc.margin.top,
  };

  /**
     * Figures slots
     */
  const slots = generateSlots(viewport, options.grid, slotMargin);
  events.emit('render:slots', slots);

  for (let layoutIndex = 0; layoutIndex < options.layouts.length; layoutIndex += 1) {
    const layout = options.layouts[layoutIndex];

    if (layoutIndex > 0) {
      // eslint-disable-next-line no-await-in-loop
      await doc.addPage();
    }

    try {
      // eslint-disable-next-line no-await-in-loop
      await renderLayoutWithVega(
        doc,
        {
          layout,
          slots,
          grid: options.grid,
          viewport,
          margin: slotMargin,
          debug: options.debug,
          colorMap,
          recurrence: options.recurrence,
        },
        events,
      );
    } catch (err) {
      if (err instanceof Error) {
        const cause = err.cause ?? {};
        err.cause = { ...cause, layout: layoutIndex };
        throw err;
      }
      throw new RenderError(`${err}`);
    }

    events.emit('render:layout', options.layouts[layoutIndex]);
  }

  return doc.render();
}
