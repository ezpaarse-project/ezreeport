import type { Task } from '@prisma/client';
import { format } from 'date-fns';
import { mkdir, writeFile } from 'fs/promises';
import type { ImageOptions } from 'jspdf';
import { merge } from 'lodash';
import { join } from 'path';
import testLayout from '../layouts/test';
import config from '../lib/config';
import {
  addPage,
  deleteDoc,
  initDoc,
  renderDoc,
  type PDFReportOptions
} from '../lib/pdf';
import { addTable } from '../lib/pdf/table';
import { calcPeriod } from '../lib/recurrence';
import {
  addVega,
  createVegaLSpec,
  createVegaView,
  isFigureTable,
  type LayoutVegaFigure
} from '../lib/vega';
import { addTaskHistory } from './tasks';

const rootPath = config.get('rootPath');
const { outDir } = config.get('pdf');

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
  layout: LayoutVegaFigure,
  opts: PDFReportOptions,
  dataOpts: any = {}, // TODO: any ??
): Promise<void> => {
  try {
    const doc = await initDoc(opts);

    /**
     * Base options for adding images with jsPDF
     */
    const baseImageOptions: Omit<ImageOptions, 'imageData'> = {
      x: doc.margin.left,
      y: doc.offset.top,
      width: doc.width - doc.margin.left - doc.margin.right,
      height: doc.height - doc.offset.top - doc.offset.bottom,
    };

    // eslint-disable-next-line no-restricted-syntax
    for (const figure of layout) {
      // eslint-disable-next-line no-await-in-loop
      await addPage();

      // eslint-disable-next-line no-await-in-loop
      const figParams = await figure(opts, dataOpts);

      if (isFigureTable(figParams)) {
        // eslint-disable-next-line no-await-in-loop
        await addTable(doc, figParams.data, figParams.params);
      } else {
        // Creating figure
        const fig = createVegaView(
          createVegaLSpec(figParams.type, figParams.data, {
            width: baseImageOptions.width,
            height: baseImageOptions.height,
            ...figParams.params,
          }),
        );
        // Adding figure to pdf
        // eslint-disable-next-line no-await-in-loop
        await addVega(doc, fig, baseImageOptions);
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
  // TODO: unique id
  const filename = `reporting_ezMESURE_${normaliseFilename(task.name)}`;

  // TODO: any ??
  let result: any = {
    success: true,
    detail: {
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

    await generatePdfWithVega(
      testLayout, // TODO: use task layout. define layout as JSON
      {
        name: task.name,
        path: join(basePath, `${filename}.pdf`),
        period,
      },
      {
        index: 'bibcnrs-*-2021',
        filters: {
          must_not: [
            {
              match_phrase: {
                mime: {
                  query: 'XLS',
                },
              },
            },
            {
              match_phrase: {
                mime: {
                  query: 'DOC',
                },
              },
            },
            {
              match_phrase: {
                mime: {
                  query: 'MISC',
                },
              },
            },
            {
              match_phrase: {
                index_name: {
                  query: 'bibcnrs-insb-dcm00',
                },
              },
            },
            {
              match_phrase: {
                index_name: {
                  query: 'bibcnrs-insb-dcm30',
                },
              },
            },
            {
              match_phrase: {
                index_name: {
                  query: 'bibcnrs-insb-dcm10',
                },
              },
            },
            {
              match_phrase: {
                index_name: {
                  query: 'bibcnrs-insb-anonyme',
                },
              },
            },
          ],
        },
      },
    );

    // TODO : email

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
          error,
        },
      },
    );
  }
  await writeFile(join(basePath, `${filename}.json`), JSON.stringify(result), 'utf-8');
  return result;
};

export const a = 1;
