import { Recurrence } from '@prisma/client';
import EventEmitter from 'events';
import Joi from 'joi';
import { merge } from 'lodash';
import {
  isFigureMd,
  isFigureMetric,
  isFigureTable
} from '../../../models/figures';
import { layoutSchema, type AnyLayout } from '../../../models/layouts';
import { ArgumentError } from '../../../types/errors';
import {
  addPage,
  deleteDoc,
  initDoc,
  renderDoc,
  type PDFReportOptions,
  type PDFStats
} from '../../pdf';
import { addMdToPDF } from '../../pdf/markdown';
import { addMetricToPDF } from '../../pdf/metrics';
import { addTableToPDF } from '../../pdf/table';
import { drawAreaRef } from '../../pdf/utils';
import { addVegaToPDF, createVegaLSpec, createVegaView } from '../../vega';

interface RenderOptions {
  doc: PDFReportOptions
  grid?: {
    rows: number,
    cols: number
  },
  layouts: AnyLayout[],
  recurrence: Recurrence,
  debug?: boolean
}

const optionScehma = Joi.object<RenderOptions>({
  doc: Joi.object({
    name: Joi.string().required(),
    period: Joi.object({
      start: Joi.date().required(),
      end: Joi.date().required(),
    }).required(),
    path: Joi.string().required(),
  }).required(),
  grid: Joi.object({
    rows: Joi.number().required(),
    cols: Joi.number().required(),
  }),
  recurrence: Joi.string().valid(
    Recurrence.DAILY,
    Recurrence.WEEKLY,
    Recurrence.MONTHLY,
    Recurrence.QUARTERLY,
    Recurrence.BIENNIAL,
    Recurrence.YEARLY,
  ).required(),
  layouts: Joi.array().items(layoutSchema).required(),
  debug: Joi.boolean(),
});

/**
 * Check if input data is fetch options
 *
 * @param data The input data
 * @returns `true` if valid
 *
 * @throws If not valid
 */
const isRenderOptions = (data: unknown): data is RenderOptions => {
  const validation = optionScehma.validate(data, {});
  if (validation.error != null) {
    throw new ArgumentError(`Fetch options are not valid: ${validation.error.message}`);
  }
  return true;
};

/**
 * Generate PDF report with Vega
 *
 * @param template The template of the report
 * @param opts The options of document (passed to {@link initDoc})
 * @param events Event handler
 *
 * @return Stats about PDF
 */
const generatePdfWithVega = async (
  options: RenderOptions,
  events: EventEmitter = new EventEmitter(),
): Promise<PDFStats> => {
  // Check options even if type is explicit, because it can be a merge between multiple sources
  if (!isRenderOptions(options)) {
    // As validation throws an error, this line shouldn't be called
    return {} as PDFStats;
  }

  try {
    const doc = await initDoc({ ...options.doc, path: `${options.doc.path}.pdf` });
    const GRID = options.grid ?? { rows: 2, cols: 2 };

    const viewport: Area = {
      x: doc.margin.left,
      y: doc.offset.top,
      width: doc.width - doc.margin.left - doc.margin.right,
      height: doc.height - doc.offset.top - doc.offset.bottom,
    };

    const marginSlot = {
      horizontal: doc.margin.left / 2,
      vertical: doc.margin.top / 2,
    };

    // FIXME: WTF + can have space
    /**
     * Calculating modififer to apply to margin. Usefull on x/y pos of slots, because else it can
     * create too little margin.
     *
     * The math that function is using is crappy and kinda black magic (ty Geogebra) and should
     * be reworked at some time.
     *
     * @param x The margin you want to apply
     *
     * @returns The modifier
     *
     * @deprecated Will be removed once a better solution is found
     */
    const calcModifier = (x: number) => 1.1607 / (1 - (1.405 * (Math.E ** (-0.604 * x))));

    const slots = Array(GRID.rows * GRID.cols).fill(undefined).map<Area>((_v, i, arr) => {
      const prev = arr[i - 1] as Area | undefined;

      const modifierH = calcModifier(GRID.cols);
      const modifierV = calcModifier(GRID.rows);

      const slot = {
        x: prev ? (prev.x + prev.width + (modifierH * marginSlot.horizontal)) : viewport.x,
        y: prev?.y ?? viewport.y,
        width: (viewport.width / GRID.cols) - marginSlot.horizontal,
        height: (viewport.height / GRID.rows) - (marginSlot.vertical),
      };

      if (prev && i % GRID.cols === 0) {
        slot.x = viewport.x;
        slot.y = prev.y + prev.height + (modifierV * marginSlot.vertical);
      }

      // To access to previous
      // eslint-disable-next-line no-param-reassign
      arr[i] = slot;
      return slot;
    });
    events.emit('slotsResolution', slots);

    let first = true;
    // eslint-disable-next-line no-restricted-syntax
    for (const layout of options.layouts) {
      const { data, figures } = layout;

      if (!first) {
        // eslint-disable-next-line no-await-in-loop
        await addPage();
      }
      first = false;

      const figuresCount = Math.min(figures.length, slots.length);

      for (let i = 0; i < figuresCount; i += 1) {
        const figure = figures[i];
        let slot: Area = {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        };

        // Slot resolution
        if (!figure.slots || figure.slots.length <= 0) {
          // Auto mode
          slot = { ...slots[i] };
          // If only one figure, take whole viewport
          if (figuresCount === 1) {
            slot.width = viewport.width;
            slot.height = viewport.height;
          }

          // If no second row, take whole height
          if (figuresCount <= slots.length - 2) {
            slot.height = viewport.height;
          }

          // If in penultimate slot and last figure, take whole remaining space
          if (i === slots.length - 2 && i === figuresCount - 1) {
            slot.width += slots[i + 1].width + doc.margin.left;
          }
        } else {
          // Manual mode
          const indexs = [...figure.slots].sort();
          slot = { ...slots[indexs[0]] };

          if (indexs.length === slots.length) {
            // Whole space
            slot = { ...viewport };
          } else if (indexs.length > 1) {
            // TODO[feat]: support squares
            if (
              indexs.every(
                // On same row
                (sIndex, j) => Math.floor(sIndex / GRID.cols) === Math.floor(indexs[0] / GRID.cols)
                  // Possible (ex: we have 3 cols, and we're asking for col 1 & 3 but not 2)
                  && (j === 0 || sIndex - indexs[j - 1] === 1),
              )
            ) {
              slot.width += slots[1].width + doc.margin.left;
            }

            if (
              indexs.every(
                // Every index on same colon
                (slotIndex, j) => slotIndex % GRID.cols === indexs[0] % GRID.cols
                  // Possible (ex: we have 3 rows, and we're asking for row 1 & 3 but not 2)
                  && (j === 0 || slotIndex - indexs[j - 1] === GRID.cols),
              )
            ) {
              slot.height += slots[1].height + doc.margin.top;
            }
          }
        }

        if (options.debug) {
          drawAreaRef(doc.pdf, slot);
        }

        if (isFigureTable(figure)) {
          // Print table
          const margin: Partial<Record<'top' | 'right' | 'bottom' | 'left', number>> = {};
          figure.params.tableWidth = slot.width;

          if (slot.x !== viewport.x) {
            margin.left = slot.x;
          }

          if (slot.y !== viewport.y) {
            figure.params.startY = slot.y;
          }

          figure.params.maxHeight = slot.height;

          const figureData = figure.data ?? data;
          if (!figureData) {
            throw new Error('No data found');
          }

          // eslint-disable-next-line no-await-in-loop
          await addTableToPDF(doc, figureData as any[], merge(figure.params, { margin }));
        } else if (isFigureMd(figure)) {
          const figureData = figure.data ?? data;
          if (!figureData) {
            throw new Error('No data found');
          }

          // eslint-disable-next-line no-await-in-loop
          await addMdToPDF(doc, figureData.toString(), {
            ...figure.params,
            start: {
              x: slot.x,
              y: slot.y,
            },
            width: slot.width,
            height: slot.height,
          });
        } else if (isFigureMetric(figure)) {
          const figureData = figure.data ?? data;
          if (!figureData) {
            throw new Error('No data found');
          }

          addMetricToPDF(doc, figureData as any[], {
            ...figure.params,
            start: {
              x: slot.x,
              y: slot.y,
            },
            width: slot.width,
            height: slot.height,
          });
        } else {
          const figureData = figure.data ?? data;
          if (!figureData) {
            throw new Error('No data found');
          }

          // Creating Vega view
          const view = createVegaView(
            createVegaLSpec(figure.type, figureData as any[], {
              ...figure.params,
              recurrence: options.recurrence,
              width: slot.width,
              height: slot.height,
            }),
          );

          // Adding view to pdf
          // eslint-disable-next-line no-await-in-loop
          await addVegaToPDF(doc, view, slot);
        }

        events.emit('figureAdded', figure);
      }

      events.emit('pageAdded', figures);
    }

    return await renderDoc();
  } catch (error) {
    await deleteDoc();
    throw error;
  }
};

export default generatePdfWithVega;
