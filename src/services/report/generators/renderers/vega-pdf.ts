import EventEmitter from 'events';
import Joi from 'joi';
import { merge } from 'lodash';
import { Recurrence } from '~/lib/prisma';
import {
  addPage,
  deleteDoc,
  initDoc,
  renderDoc,
  type PDFReportOptions,
  type PDFStats
} from '~/lib/pdf';
import { addMdToPDF } from '~/lib/pdf/markdown';
import { addMetricToPDF } from '~/lib/pdf/metrics';
import { addTableToPDF } from '~/lib/pdf/table';
import { drawAreaRef } from '~/lib/pdf/utils';
import { addVegaToPDF, createVegaLSpec, createVegaView } from '~/lib/vega';
import { type AnyFigure } from '~/models/figures';
import { layoutSchema, type AnyLayout } from '~/models/layouts';
import { ArgumentError } from '~/types/errors';

interface Grid {
  rows: number,
  cols: number
}

interface Margin {
  vertical: number,
  horizontal: number,
}

interface RenderOptions {
  // Auto fields
  doc: PDFReportOptions
  recurrence: Recurrence,
  debug?: boolean
  // Resolved fields
  layouts: AnyLayout[],
  // Template specific
  grid?: Grid,
}

const optionSchema = Joi.object<RenderOptions>({
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
  const validation = optionSchema.validate(data, {});
  if (validation.error != null) {
    throw new ArgumentError(`Fetch options are not valid: ${validation.error.message}`);
  }
  return true;
};

// FIXME: WTF + still can have space
/**
 * Calculating modifier to apply to margin. Useful on x/y pos of slots, because else it can
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

/**
 * Generate slots according to template's grid definition
 *
 * @param params
 *
 * @returns The slots position & dimensions
 */
const generateSlots = (params: {
  /**
   * Page's viewport
   */
  viewport: Area,
  /**
   * Template's grid definition
   */
  grid: Grid,
  /**
   * Spaces between 2 slots
   */
  margin: Margin
}) => {
  const { viewport, margin, grid } = params;

  const baseSlots = Array(grid.rows * grid.cols).fill(0).map<Area>((_v, i, arr) => {
    const prev = arr[i - 1] as Area | undefined;

    const modifierH = calcModifier(grid.cols);
    const modifierV = calcModifier(grid.rows);

    const slot = {
      x: prev ? (prev.x + prev.width + (modifierH * (margin.horizontal / 2))) : viewport.x,
      y: prev?.y ?? viewport.y,
      width: (viewport.width / grid.cols) - (margin.horizontal / 2),
      height: (viewport.height / grid.rows) - (margin.vertical / 2),
    };

    if (prev && i % grid.cols === 0) {
      slot.x = viewport.x;
      slot.y = prev.y + prev.height + (modifierV * (margin.vertical / 2));
    }

    // Reassign param to access to previous
    // eslint-disable-next-line no-param-reassign
    arr[i] = slot;
    return slot;
  });

  return baseSlots;
};

/**
 * Resolve size to add when slots are manually provided in template
 *
 * @param params
 *
 * @returns The size to add to the base slot
 */
const resolveManualFigureSlot = (params: {
  /**
   * Slots indices wanted by template
   */
  indices: number[],
  /**
   * Next slot wanted by template
   */
  nextSlot: Area,
  /**
   * Template's grid definition
   */
  grid: Grid,
  /**
   * Spaces between 2 slots
   */
  margin: Margin,
}): Size => {
  const {
    grid, margin, indices, nextSlot,
  } = params;
  const additionalSize: Size = {
    width: 0,
    height: 0,
  };

  // TODO[feat]: support squares
  if (
    indices.every(
      // Every index on same row
      (sIndex, j) => Math.floor(sIndex / grid.cols) === Math.floor(indices[0] / grid.cols)
        // Possible (ex: we have 3 cols, and we're asking for col 1 & 3 but not 2)
        && (j === 0 || sIndex - indices[j - 1] === 1),
    )
  ) {
    additionalSize.width = nextSlot.width + margin.horizontal;
  }

  if (
    indices.every(
      // Every index on same colon
      (slotIndex, j) => slotIndex % grid.cols === indices[0] % grid.cols
        // Possible (ex: we have 3 rows, and we're asking for row 1 & 3 but not 2)
        && (j === 0 || slotIndex - indices[j - 1] === grid.cols),
    )
  ) {
    additionalSize.height = nextSlot.height + margin.vertical;
  }

  return additionalSize;
};

/**
 * Resolve slot used by current iteration
 *
 * @param params
 *
 * @returns The figure & the slot
 */
const resolveSlot = (params: {
  /**
   * Possible slots (@see {@link generateSlots})
   */
  slots: Area[],
  /**
   * Current layout's figures
   */
  figures: AnyFigure[],
  /**
   * Current iteration of figure
   */
  figureIndex: number,
  /**
   * Template's grid definition
   */
  grid: Grid,
  /**
   * Page's viewport
   */
  viewport: Area,
  /**
   * Spaces between 2 slots
   */
  margin: Margin
}) => {
  const {
    slots, viewport, grid, figures, figureIndex, margin,
  } = params;
  const figure = figures[figureIndex];
  let slot: Area;

  // Slot resolution
  if (figure.slots && figure.slots.length > 0) {
    // Manual mode
    const indices = [...figure.slots].sort();
    // Take first wanted slot by default
    slot = { ...slots[indices[0]] };

    if (indices.length === slots.length) {
      // Take whole space if all slots are needed
      slot = { ...viewport };
    } else if (indices.length > 1) {
      // More complex situations
      const { width, height } = resolveManualFigureSlot({
        nextSlot: slots[1],
        grid,
        margin,
        indices,
      });

      slot.width += width;
      slot.height += height;
    }
  } else {
    // Auto mode
    slot = { ...slots[figureIndex] };
    // If only one figure, take whole viewport
    if (figures.length === 1) {
      slot.width = viewport.width;
      slot.height = viewport.height;
    }

    // If no second row, take whole height
    if (figures.length <= slots.length - 2) {
      slot.height = viewport.height;
    }

    // If in penultimate slot and last figure, take whole remaining space
    if (figureIndex === slots.length - 2 && figureIndex === figures.length - 1) {
      slot.width += slots[figureIndex + 1].width + margin.horizontal;
    }
  }
  return {
    slot,
    figure,
  };
};

/**
 * Generate PDF report with Vega
 *
 * @param options The options of renderer
 * @param events Event handler
 *
 * @fires #slotsGenerated When base slots are generated.
 * @fires #figureRendered When figure is added in a slot.
 * @fires #layoutRendered When a layout is rendered.
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
    const grid: Grid = options.grid ?? { cols: 2, rows: 2 };

    /**
     * Figures slots
     */
    const slots = generateSlots({
      viewport,
      grid,
      margin: slotMargin,
    });
    events.emit('slotsGenerated', slots);

    for (let layoutIndex = 0; layoutIndex < options.layouts.length; layoutIndex += 1) {
      const { data, figures } = options.layouts[layoutIndex];

      if (layoutIndex > 0) {
        // eslint-disable-next-line no-await-in-loop
        await addPage();
      }

      // Limit number of figures to the number of possible slots
      figures.length = Math.min(figures.length, slots.length);

      for (let figureIndex = 0; figureIndex < figures.length; figureIndex += 1) {
        const { figure, slot } = resolveSlot({
          figureIndex,
          figures,
          grid,
          margin: slotMargin,
          slots,
          viewport,
        });

        if (options.debug) {
          drawAreaRef(doc.pdf, slot);
        }

        switch (figure.type) {
          case 'table': {
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
            break;
          }

          case 'md': {
            // Print MD
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
            break;
          }

          case 'metric': {
            // Print Metrics
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
            break;
          }

          default: {
            // Print Vega chart
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

            // eslint-disable-next-line no-await-in-loop
            await addVegaToPDF(doc, view, slot);
            break;
          }
        }
        events.emit('figureRendered', figure);
      }

      events.emit('layoutRendered', figures);
    }

    return await renderDoc();
  } catch (error) {
    await deleteDoc();
    throw error;
  }
};

export default generatePdfWithVega;
