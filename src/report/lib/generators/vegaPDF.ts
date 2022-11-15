import { merge } from 'lodash';
import { isFigureMd, isFigureMetric, isFigureTable } from '../../models/figures';
import type { Layout } from '../../models/layouts';
import { addMdToPDF } from '../markdown';
import { addMetricToPDF } from '../metrics';
import {
  addPage,
  deleteDoc,
  initDoc,
  renderDoc,
  type PDFReportOptions,
  type PDFStats
} from '../pdf';
import { addTableToPDF } from '../pdf/table';
import { drawAreaRef } from '../pdf/utils';
import { addVegaToPDF, createVegaLSpec, createVegaView } from '../vega';

type Options = PDFReportOptions & {
  debugPages?: boolean,
  GRID?: { rows: number, cols: number },
};

/**
 * Generate PDF report with Vega
 *
 * @param layout The layout of the report
 * @param opts The options passed to the PDF Document
 */
const generatePdfWithVega = async (
  layout: Layout,
  {
    debugPages,
    GRID = { rows: 2, cols: 2 },
    ...opts
  }: Options,
): Promise<PDFStats> => {
  try {
    const doc = await initDoc(opts);

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

    let first = true;
    // eslint-disable-next-line no-restricted-syntax
    for (const page of layout) {
      if (!first) {
        // eslint-disable-next-line no-await-in-loop
        await addPage();
      }
      first = false;

      // eslint-disable-next-line no-await-in-loop
      let figures = await page();
      if (!Array.isArray(figures)) figures = [figures];

      const figuresCount = Math.min(figures.length, slots.length);

      for (let i = 0; i < figuresCount; i += 1) {
        const figure = figures[i];
        let slot: Area = {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        };

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

        if (debugPages) {
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

          // eslint-disable-next-line no-await-in-loop
          await addTableToPDF(doc, figure.data, merge(figure.params, { margin }));
        } else if (isFigureMd(figure)) {
          // eslint-disable-next-line no-await-in-loop
          await addMdToPDF(doc, figure.data, {
            ...figure.params,
            start: {
              x: slot.x,
              y: slot.y,
            },
            width: slot.width,
            height: slot.height,
          });
        } else if (isFigureMetric(figure)) {
          addMetricToPDF(doc, figure.data, {
            ...figure.params,
            start: {
              x: slot.x,
              y: slot.y,
            },
            width: slot.width,
            height: slot.height,
          });
        } else {
          // Creating Vega view
          const view = createVegaView(
            createVegaLSpec(figure.type, figure.data, {
              ...figure.params,
              width: slot.width,
              height: slot.height,
            }),
          );
          // Adding view to pdf
          // eslint-disable-next-line no-await-in-loop
          await addVegaToPDF(doc, view, slot);
        }
      }
    }

    return await renderDoc();
  } catch (error) {
    await deleteDoc();
    throw error;
  }
};

export default generatePdfWithVega;
