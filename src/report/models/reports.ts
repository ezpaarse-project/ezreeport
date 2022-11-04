import type { Recurrence, Task } from '@prisma/client';
import { randomUUID } from 'crypto';
import { format } from 'date-fns';
import { mkdir, writeFile } from 'fs/promises';
import { merge } from 'lodash';
import { join } from 'path';
import type { Mark } from 'vega-lite/build/src/mark';
import config from '../lib/config';
import { addMdToPDF, MdParams } from '../lib/markdown';
import {
  addPage,
  deleteDoc,
  initDoc,
  renderDoc,
  type PDFReportOptions
} from '../lib/pdf';
import { addTableToPDF, type TableParams } from '../lib/pdf/table';
import { calcPeriod } from '../lib/recurrence';
import {
  addVegaToPDF,
  createVegaLSpec,
  createVegaView,
  type InputVegaParams
} from '../lib/vega';
import { addTaskHistory } from './tasks';

const rootPath = config.get('rootPath');
const { outDir } = config.get('pdf');

// TODO[feat]: Metrics type

type FigureType = Mark | 'table' | 'md';

interface FigureParams extends Record<FigureType, object> {
  table: TableParams,
  md: MdParams
}

/**
 * Figure definition
 */
export interface Figure<Type extends FigureType> {
  type: Type;
  data: Type extends 'md' ? string : unknown[];
  params: Type extends Mark ? InputVegaParams : FigureParams[Type];
}

/**
 * Global figure definition
 */
type AnyFigure = Figure<Mark> | Figure<'table'> | Figure<'md'>;

type AnyFigureFnc = (docOpts: PDFReportOptions) => AnyFigure | AnyFigure[];

export type Layout = Array<AnyFigureFnc | Promisify<AnyFigureFnc>>;

export type LayoutFnc = (
  task: { recurrence: Recurrence, period: Interval },
  dataOpts: any
) => Layout;

type LayoutSlot = {
  x: number,
  y: number,
  height: number,
  width: number
};

/**
 * Check if the given figure is a table
 *
 * @param figure The figure
 * @returns Is the figure is a table
 */
const isFigureTable = (figure: AnyFigure): figure is Figure<'table'> => figure.type === 'table';

/**
 * Check if the given figure is a text
 *
 * @param figure The figure
 * @returns Is the figure is a text
 */
const isFigureMd = (figure: AnyFigure): figure is Figure<'md'> => figure.type === 'md';

/**
 * Put filename in lowercase & remove chars that can cause issues.
 *
 * @param filename The original filename
 *
 * @returns The normalized filename
 */
const normaliseFilename = (filename: string): string => filename.toLowerCase().replace(/[/ .]/g, '-');

/**
 * Generate PDF report with Vega
 *
 * @param layout The layout of the report
 * @param opts The options passed to the PDF Document
 * @param dataOpts Data options (usually filters and elastic inde)
 */
const generatePdfWithVega = async (
  layout: Layout,
  opts: PDFReportOptions,
): Promise<void> => {
  try {
    const doc = await initDoc(opts);

    const viewport: LayoutSlot = {
      x: doc.margin.left,
      y: doc.offset.top,
      width: doc.width - doc.margin.left - doc.margin.right,
      height: doc.height - doc.offset.top - doc.offset.bottom,
    };

    // TODO[feat]: Custom slots
    const slots = Array.from<Partial<LayoutSlot>, LayoutSlot>(
      [
        {},
        {
          x: viewport.x + viewport.width / 2 + (doc.margin.left / 2),
        },
        {
          y: viewport.y + viewport.height / 2 + (doc.margin.top / 2),
        },
        {
          x: viewport.x + viewport.width / 2 + (doc.margin.left / 2),
          y: viewport.y + viewport.height / 2 + (doc.margin.top / 2),
        },
      ],
      (slot) => ({
        x: viewport.x,
        y: viewport.y,
        width: (viewport.width / 2) - (doc.margin.left / 2),
        height: (viewport.height / 2) - (doc.margin.top / 2),
        ...slot,
      }),
    );

    let first = true;
    // eslint-disable-next-line no-restricted-syntax
    for (const page of layout) {
      if (!first) {
        // eslint-disable-next-line no-await-in-loop
        await addPage();
      }
      first = false;

      // eslint-disable-next-line no-await-in-loop
      let figures = await page(opts);
      if (!Array.isArray(figures)) figures = [figures];

      const figuresCount = Math.min(figures.length, slots.length);

      for (let i = 0; i < figuresCount; i += 1) {
        const figure = figures[i];
        const slot = { ...slots[i] };

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
          slot.width += slots[i + 1].width;
          slot.height += slots[i + 1].height;
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
          await addMdToPDF(doc, figure.data, figure.params);
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

    await renderDoc();
  } catch (error) {
    await deleteDoc();
    throw error;
  }
};

/**
 * Generate report
 *
 * @param task The task to generate
 * @param origin The origin of the generation (can be username, or method (auto, etc.))
 * @param writeHistory Should write generation in task history
 *
 * @returns ...
 */
export const generateReport = async (task: Task, origin: string, writeHistory = true) => {
  const today = new Date();
  const todayStr = format(today, 'yyyy/yyyy-MM');
  const basePath = join(rootPath, outDir, todayStr, '/');

  let filename = `reporting_ezMESURE_${normaliseFilename(task.name)}`;
  if (process.env.NODE_ENV === 'production' || writeHistory) {
    filename += `_${randomUUID()}`;
  }

  let result: any = {
    success: true,
    detail: {
      date: new Date(),
      task: task.id,
      files: {
        detail: `${todayStr}/${filename}.json`,
      },
    },
  };

  await mkdir(basePath, { recursive: true });

  try {
    const targets = task.targets.filter((email) => email !== '');
    if (targets.length <= 0) {
      throw new Error("Targets can't be null");
    }

    const period = calcPeriod(today, task.recurrence);
    // TODO[feat]: define layout as JSON. Use JOI
    let baseLayout: LayoutFnc | undefined;
    if (typeof task.layout === 'object' && (task.layout as any).extends) {
      baseLayout = (await import(`../layouts/${(task.layout as any).extends}`)).default;
    }
    if (!baseLayout) {
      throw new Error(`Layout "${(task.layout as any).extends}" not found`);
    }

    await generatePdfWithVega(
      baseLayout(
        {
          recurrence: task.recurrence,
          period,
        },
        (task.layout as any).data, // { index: string, filters: ... }
      ),
      // Report options
      {
        name: task.name,
        path: join(basePath, `${filename}.pdf`),
        period,
      },
    );

    if (writeHistory) {
      await addTaskHistory(task.id, { type: 'generation-success', message: `Rapport "${todayStr}/${filename}" généré par ${origin}` });
    }

    result = merge(
      result,
      {
        detail: {
          files: { report: `${todayStr}/${filename}.pdf` },
          writedTo: targets,
          period,
        },
      },
    );
  } catch (error) {
    if (writeHistory) {
      await addTaskHistory(task.id, { type: 'generation-error', message: `Rapport "${todayStr}/${filename}" non généré par ${origin} suite à une erreur` });
    }

    result = merge(
      result,
      {
        success: false,
        detail: {
          error: (error as Error).message,
        },
      },
    );
  }
  await writeFile(join(basePath, `${filename}.json`), JSON.stringify(result), 'utf-8');
  return result;
};
