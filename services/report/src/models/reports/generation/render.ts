import EventEmitter from 'node:events';

import { merge } from 'lodash';
import { Mark } from 'vega-lite/build/src/mark';

import { asyncWithCommonHandlers, commonHandlers, syncWithCommonHandlers } from '~/lib/utils';
import {
  addPage,
  deleteDoc,
  initDoc,
  renderDoc,
  type PDFStats,
  type PDFReport,
} from '~/lib/pdf';
import { addMdToPDF } from '~/lib/pdf/markdown';
import { addMetricToPDF } from '~/lib/pdf/metrics';
import { addTableToPDF } from '~/lib/pdf/table';
import { drawAreaRef } from '~/lib/pdf/utils';
import {
  addVegaToPDF,
  createVegaLSpec,
  createVegaView,
  parseTitle,
} from '~/lib/vega';

import { Recurrence } from '~/models/recurrence';
import type { TemplateBodyGridType, FigureType, LayoutType } from '~/models/templates/types';
import type { ReportPeriodType } from '~/models/reports/types';

import type { FetchResultItem } from './fetch/results';

interface Margin {
  vertical: number,
  horizontal: number,
}

type VegaRenderOptionsType = {
  doc: {
    name: string;
    period: ReportPeriodType;
    namespace: {
      name: string;
    };
    path: string;
  };
  recurrence: Recurrence;
  debug: boolean;
  layouts: LayoutType[];
  grid: TemplateBodyGridType;
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
  grid: TemplateBodyGridType,
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
  grid: TemplateBodyGridType,
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
  figures: FigureType[],
  /**
   * Current iteration of figure
   */
  figureIndex: number,
  /**
   * Template's grid definition
   */
  grid: TemplateBodyGridType,
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
    slots,
    viewport,
    grid,
    figures,
    figureIndex,
    margin,
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

type RenderFigureParams = {
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
  recurrence: Recurrence,
  order?: 'asc' | 'desc',
};

/**
 * Render a table
 *
 * @param params
 */
const renderTable = async (params: RenderFigureParams) => {
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
const renderMarkdown = async (params: RenderFigureParams) => {
  const {
    doc,
    figure,
    slot,
    data,
  } = params;

  if (!data.toString) {
    throw new Error('Provided data is not string compatible');
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
const renderMetrics = async (params: RenderFigureParams) => {
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
const renderVegaChart = async (params: RenderFigureParams) => {
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

  const view = syncWithCommonHandlers(
    () => createVegaView(spec),
    { vegaSpec: { ...spec, datasets: undefined } },
  );

  await addVegaToPDF(doc, view, slot);
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
const renderPdfWithVega = async (
  options: VegaRenderOptionsType,
  events: EventEmitter = new EventEmitter(),
): Promise<PDFStats> => {
  const colorMap = new Map<string, string>();

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

    /**
     * Figures slots
     */
    const slots = generateSlots({
      viewport,
      grid: options.grid,
      margin: slotMargin,
    });
    events.emit('slotsGenerated', slots);

    for (let layoutIndex = 0; layoutIndex < options.layouts.length; layoutIndex += 1) {
      // eslint-disable-next-line no-await-in-loop
      await asyncWithCommonHandlers(
        async () => {
          const { figures } = options.layouts[layoutIndex];

          if (layoutIndex > 0) {
            await addPage();
          }

          // Limit number of figures to the number of possible slots
          figures.length = Math.min(figures.length, slots.length);

          for (let figureIndex = 0; figureIndex < figures.length; figureIndex += 1) {
            try {
              const { figure, slot } = resolveSlot({
                figureIndex,
                figures,
                grid: options.grid,
                margin: slotMargin,
                slots,
                viewport,
              });

              if (options.debug) {
                drawAreaRef(doc.pdf, slot);
              }

              if (!figure.data) {
                throw new Error('No data found');
              }

              let render = renderVegaChart;
              switch (figure.type) {
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

              let order;
              if (figure.params.order !== false) {
                order = figure.params.order === true ? 'desc' : figure.params.order;
              }

              // eslint-disable-next-line no-await-in-loop
              await render({
                doc,
                colorMap,
                figure,
                viewport,
                slot,
                order,
                data: figure.data,
                recurrence: options.recurrence,
              });

              events.emit('figureRendered', figure);
            } catch (error) {
              const figure = figures[figureIndex];
              const title = figure?.params?.title || figure?.type || (figureIndex + 1);
              throw commonHandlers(error, { figure: title });
            }
          }

          events.emit('layoutRendered', figures);
        },
        {
          layout: layoutIndex,
          type: 'render',
        },
      );
    }

    return await renderDoc();
  } catch (error) {
    await deleteDoc();
    throw error;
  }
};

export default renderPdfWithVega;
