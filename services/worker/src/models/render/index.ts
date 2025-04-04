import EventEmitter from 'node:events';

import { asyncWithCommonHandlers, commonHandlers } from '@ezreeport/models/lib/utils';

import type { RecurrenceType } from '@ezreeport/models/recurrence';
import type { FigureType, LayoutType, TemplateBodyGridType } from '@ezreeport/models/templates';
import type { ReportPeriodType } from '@ezreeport/models/reports';
import { appLogger } from '~/lib/logger';

import type { Area, Margin } from './types';
import { generateSlots, resolveSlot } from './slots';
import renderFigure from './figures';
import { createPDF, initPDFEngine } from './pdf';
import { drawAreaRef } from './pdf/utils';
import type { PDFReport, PDFStats } from './pdf/types';
import { initVegaEngine } from './vega';

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

export type VegaRenderOptionsType = {
  doc: {
    name: string;
    period: ReportPeriodType;
    namespace: {
      name: string;
    };
    path: string;
  };
  recurrence: RecurrenceType;
  debug: boolean;
  layouts: LayoutType[];
  grid: TemplateBodyGridType;
};

export interface RenderEventMap extends Record<string, unknown[]> {
  'render:slots': [slots: Area[]];
  'render:figure': [figure: FigureType];
  'render:layout': [layout: LayoutType];
}

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
): Promise<PDFStats> {
  const colorMap = new Map<string, string>();

  let d: PDFReport | undefined;
  try {
    const doc = await createPDF({ ...options.doc, path: `${options.doc.path}.pdf` });
    d = doc;

    /**
     * Usage space in page
     */
    const viewport = {
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
      // eslint-disable-next-line no-await-in-loop
      await asyncWithCommonHandlers(
        async () => {
          const { figures } = options.layouts[layoutIndex];

          if (layoutIndex > 0) {
            await doc.addPage();
          }

          // Limit number of figures to the number of possible slots
          figures.length = Math.min(figures.length, slots.length);

          for (let figureIndex = 0; figureIndex < figures.length; figureIndex += 1) {
            try {
              const { figure, slot } = resolveSlot(
                slots,
                figures,
                figureIndex,
                options.grid,
                viewport,
                slotMargin,
              );

              if (options.debug) {
                drawAreaRef(doc.pdf, slot);
              }

              if (!figure.data) {
                throw new Error('No data found');
              }

              let order;
              if (figure.params.order !== false) {
                order = figure.params.order === true ? 'desc' : figure.params.order;
              }

              // eslint-disable-next-line no-await-in-loop
              await renderFigure({
                doc,
                colorMap,
                figure,
                viewport,
                slot,
                order,
                data: figure.data,
                recurrence: options.recurrence,
              });

              events.emit('render:figure', figure);
            } catch (error) {
              const figure = figures[figureIndex];
              const title = figure?.params?.title || figure?.type || (figureIndex + 1);
              throw commonHandlers(error, { figure: title });
            }
          }

          events.emit('render:layout', options.layouts[layoutIndex]);
        },
        {
          layout: layoutIndex,
          type: 'render',
        },
      );
    }

    return await doc.render();
  } catch (error) {
    await d?.delete();
    throw error;
  }
}
