import EventEmitter from 'node:events';

import type { RecurrenceType } from '@ezreeport/models/recurrence';
import type { ReportPeriodType } from '@ezreeport/models/reports';
import type {
  FigureType,
  LayoutType,
  TemplateBodyGridType,
  TemplateLocaleType,
} from '@ezreeport/models/templates';

import { appLogger } from '~/lib/logger';

import type { PDFReport, PDFResult } from './pdf/types';
import type { Area, Margin } from './types';
import RenderError from './errors';
import renderFigure from './figures';
import { createPDF, initPDFEngine } from './pdf';
import { drawAreaRef } from './pdf/utils';
import { generateSlots, resolveSlot } from './slots';
import { initVegaEngine } from './vega';

export async function initRenderEngine(): Promise<void> {
  const start = process.uptime();

  await initPDFEngine();
  initVegaEngine();

  appLogger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
    scope: 'render-engine',
  });
}

export type RenderEventMap = Record<string, unknown[]> & {
  'render:slots': [slots: Area[]];
  'render:figure': [figure: FigureType];
  'render:layout': [layout: LayoutType];
};

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
  options: FigureRenderOptionsType
): Promise<void> {
  if (options.debug) {
    drawAreaRef(doc.pdf, options.slot);
  }

  if (!options.figure.data) {
    throw new RenderError('No data found', 'EmptyDataError');
  }

  let order;
  if (options.figure.params.order !== false) {
    order =
      options.figure.params.order === true
        ? 'desc'
        : options.figure.params.order;
  }

  await renderFigure({
    colorMap: options.colorMap,
    data: options.figure.data,
    doc,
    figure: options.figure,
    order,
    recurrence: options.recurrence,
    slot: options.slot,
    viewport: options.viewport,
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
  events: EventEmitter<RenderEventMap>
): Promise<void> {
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
      options.margin
    );

    try {
      // oxlint-disable-next-line no-await-in-loop
      await renderFigureWithVega(doc, {
        ...options,
        figure,
        slot,
      });
    } catch (error) {
      if (error instanceof Error) {
        const cause = error.cause ?? {};
        error.cause = { ...cause, figure: figureIndex };
        throw error;
      }
      throw new RenderError(`${error}`);
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
    locale: TemplateLocaleType;
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
 * @returns Stats about PDF
 */
export async function renderPdfWithVega(
  options: VegaRenderOptionsType,
  events = new EventEmitter<RenderEventMap>()
): Promise<PDFResult> {
  const colorMap = new Map<string, string>();

  const doc = createPDF(options.doc);

  /**
   * Usage space in page
   */
  const viewport: Area = {
    // oxlint-disable-next-line id-length
    x: doc.margin.left,
    // oxlint-disable-next-line id-length
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

  for (
    let layoutIndex = 0;
    layoutIndex < options.layouts.length;
    layoutIndex += 1
  ) {
    const layout = options.layouts[layoutIndex];

    if (layoutIndex > 0) {
      doc.addPage();
    }

    try {
      // oxlint-disable-next-line no-await-in-loop
      await renderLayoutWithVega(
        doc,
        {
          colorMap,
          debug: options.debug,
          grid: options.grid,
          layout,
          margin: slotMargin,
          recurrence: options.recurrence,
          slots,
          viewport,
        },
        events
      );
    } catch (error) {
      if (error instanceof Error) {
        const cause = error.cause ?? {};
        error.cause = { ...cause, layout: layoutIndex };
        throw error;
      }
      throw new RenderError(`${error}`);
    }

    events.emit('render:layout', options.layouts[layoutIndex]);
  }

  return doc.render();
}
