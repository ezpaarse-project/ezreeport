import type { Recurrence, Task } from '@prisma/client';
import { format } from 'date-fns';
import { merge } from 'lodash';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Mark } from 'vega-lite/build/src/mark';
import config from '../lib/config';
import { addMdToPDF, type InputMdParams } from '../lib/markdown';
import { addMetricToPDF, type InputMetricParams, type MetricData } from '../lib/metrics';
import {
  addPage,
  deleteDoc,
  initDoc,
  renderDoc,
  type PDFReportOptions
} from '../lib/pdf';
import { addTableToPDF, type TableParams } from '../lib/pdf/table';
import { drawAreaRef } from '../lib/pdf/utils';
import { calcNextDate, calcPeriod } from '../lib/recurrence';
import {
  addVegaToPDF,
  createVegaLSpec,
  createVegaView,
  type InputVegaParams
} from '../lib/vega';
import { findInstitutionByIds, findInstitutionContact } from './institutions';
import { addTaskHistory, slientEditTaskById } from './tasks';

const rootPath = config.get('rootPath');
const { outDir } = config.get('pdf');

export enum SlotIndex {
  TOP_LEFT = 0,
  TOP_RIGHT,
  BOTTOM_LEFT,
  BOTTOM_RIGHT,
}

type FigureType = Mark | 'table' | 'md' | 'metric';

interface FigureParams extends Record<FigureType, object> {
  table: TableParams,
  md: InputMdParams,
  metric: InputMetricParams
}

interface FigureData extends Record<FigureType, unknown[]> {
  metric: MetricData[]
}

/**
 * Figure definition
 */
export interface Figure<Type extends FigureType> {
  type: Type;
  data: Type extends 'md' ? string : FigureData[Type];
  params: Type extends Mark ? InputVegaParams : FigureParams[Type];
  slots?: SlotIndex[]
}

/**
 * Global figure definition
 */
type AnyFigure = Figure<Mark> | Figure<'table'> | Figure<'md'> | Figure<'metric'>;

type AnyFigureFnc = (docOpts: PDFReportOptions) => AnyFigure | AnyFigure[];

export type Layout = Array<AnyFigureFnc | Promisify<AnyFigureFnc>>;

export type LayoutFnc = (
  task: { recurrence: Recurrence, period: Interval, user: string },
  dataOpts: any
) => Layout | Promise<Layout>;

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
 * Check if the given figure is a metric
 *
 * @param figure The figure
 * @returns Is the figure is a metric
 */
const isFigureMetric = (figure: AnyFigure): figure is Figure<'metric'> => figure.type === 'metric';

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
 */
const generatePdfWithVega = async (
  layout: Layout,
  { debugPages, ...opts }: PDFReportOptions,
): Promise<void> => {
  try {
    const doc = await initDoc(opts);

    const viewport: Area = {
      x: doc.margin.left,
      y: doc.offset.top,
      width: doc.width - doc.margin.left - doc.margin.right,
      height: doc.height - doc.offset.top - doc.offset.bottom,
    };

    // TODO[feat]: Custom slots or grid
    const GRID = { rows: 2, cols: 2 };
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
      let figures = await page(opts);
      if (!Array.isArray(figures)) figures = [figures];

      const figuresCount = Math.min(figures.length, slots.length);

      for (let i = 0; i < figuresCount; i += 1) {
        const figure = figures[i];
        // TODO[feat]: Choose which graph will go in which slot
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
          // TODO[feat]: Multiples layout with Md
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
          // TODO[feat]: Multiples layout with Metrics
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
 * @param writeHistory Should write generation in task history (also disable first level of debug)
 * @param debug Enable second level of debug
 *
 * @returns ...
 */
export const generateReport = async (
  task: Task,
  origin: string,
  writeHistory = true,
  debug = false,
) => {
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

    // Get institution
    const [institution = { _source: null }] = await findInstitutionByIds([task.institution]);
    // eslint-disable-next-line no-underscore-dangle
    if (!institution._source) {
      throw new Error(`Institution "${task.institution}" not found`);
    }

    // Get username who will run the requests
    // eslint-disable-next-line no-underscore-dangle
    const contact = (await findInstitutionContact(institution._id.toString())) ?? { _source: null };
    // eslint-disable-next-line no-underscore-dangle
    if (!contact._source) {
      throw new Error(`No suitable contact found for your institution "${task.institution}". Please add doc_contact or tech_contact.`);
    }
    const { _source: { username: user } } = contact;

    const period = calcPeriod(new Date(2021, 9, 31, 12), task.recurrence);
    // const period = calcPeriod(today, task.recurrence);
    // TODO[feat]: define layout as JSON. Use JOI
    let baseLayout: LayoutFnc | undefined;
    if (typeof task.layout === 'object' && (task.layout as any).extends) {
      baseLayout = (await import(`../layouts/${(task.layout as any).extends}`)).default;
    }
    if (!baseLayout) {
      throw new Error(`Layout "${(task.layout as any).extends}" not found`);
    }

    await generatePdfWithVega(
      await baseLayout(
        {
          recurrence: task.recurrence,
          period,
          user,
        },
        {
          // { indexSuffix: string, filters: ... }
          ...(task.layout as any).data,
          // eslint-disable-next-line no-underscore-dangle
          indexPrefix: institution._source?.institution.indexPrefix,
        },
      ),
      // Report options
      {
        name: task.name,
        path: join(basePath, `${filename}.pdf`),
        period,
        debugPages: debug,
      },
    );

    if (writeHistory) {
      await slientEditTaskById(
        task.id,
        { nextRun: calcNextDate(today, task.recurrence), lastRun: today },
      );
      await addTaskHistory(
        task.id,
        { type: 'generation-success', message: `Rapport "${todayStr}/${filename}" généré par ${origin}` },
      );
    }

    result = merge(
      result,
      {
        detail: {
          files: { report: `${todayStr}/${filename}.pdf` },
          writedTo: targets,
          period,
          runAs: user,
        },
      },
    );
  } catch (error) {
    await slientEditTaskById(task.id, { enabled: false });
    if (writeHistory) {
      await addTaskHistory(task.id, { type: 'generation-error', message: `Rapport "${todayStr}/${filename}" non généré par ${origin} suite à une erreur.` });
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
