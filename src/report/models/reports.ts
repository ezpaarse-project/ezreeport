import type { Task } from '@prisma/client';
import { format } from 'date-fns';
import { compact, merge, omit } from 'lodash';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import config from '../lib/config';
import generatePdfWithVega from '../lib/generators/vegaPDF';
import { calcNextDate, calcPeriod } from '../lib/recurrence';
import { findInstitutionByIds, findInstitutionContact } from './institutions';
import { isValidLayout, type LayoutFnc } from './layouts';
import { addTaskHistory, slientEditTaskById } from './tasks';

const rootPath = config.get('rootPath');
const { outDir } = config.get('pdf');

type ReportResult = {
  success: boolean,
  detail: {
    date: Date,
    task: Task['id'],
    files: {
      detail: string,
      report?: string
    },
    writedTo?: string[],
    period?: Interval,
    runAs?: string,
    stats?: Omit<Awaited<ReturnType<typeof generatePdfWithVega>>, 'path'>,
    error?: string,
  }
};

/**
 * Put filename in lowercase & remove chars that can cause issues.
 *
 * @param filename The original filename
 *
 * @returns The normalized filename
 */
const normaliseFilename = (filename: string): string => filename.toLowerCase().replace(/[/ .]/g, '-');

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
): Promise<ReportResult> => {
  const today = new Date();
  const todayStr = format(today, 'yyyy/yyyy-MM');
  const basePath = join(rootPath, outDir, todayStr, '/');

  let filename = `reporting_ezMESURE_${normaliseFilename(task.name)}`;
  if (process.env.NODE_ENV === 'production' || writeHistory) {
    filename += `_${randomUUID()}`;
  }

  let result: ReportResult = {
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
    const targets = compact(task.targets);
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

    if (!isValidLayout(task.layout)) {
      // As validation throws an error, this line shouldn't be called
      return {} as ReportResult;
    }

    if (/\.\./i.test(task.layout.extends)) {
      throw new Error("For security reasons, you can't access to a parent folder");
    }

    const imported = (await import(`../layouts/${task.layout.extends}`));
    // eslint-disable-next-line no-underscore-dangle
    const { default: baseLayout, GRID } = (imported.__esModule ? imported : imported.default) as {
      GRID?: { rows: number, cols: number },
      default?: LayoutFnc
    };
    if (!baseLayout) {
      throw new Error(`Layout "${task.layout.extends}" not found`);
    }

    const layout = await baseLayout(
      {
        recurrence: task.recurrence,
        // eslint-disable-next-line no-underscore-dangle
        institution: institution._source?.institution,
        period,
        user,
      },
      task.layout.data,
    );

    if (task.layout.inserts) {
      // eslint-disable-next-line no-restricted-syntax
      for (const { at, figures } of task.layout.inserts) {
        const fnc = () => figures;
        layout.splice(at, 0, fnc);
      }
    }

    const stats = await generatePdfWithVega(
      layout,
      // Report options
      {
        name: task.name,
        path: join(basePath, `${filename}.pdf`),
        period,
        debugPages: debug,
        GRID,
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

    result = merge<ReportResult, DeepPartial<ReportResult>>(
      result,
      {
        detail: {
          files: { report: `${todayStr}/${filename}.pdf` },
          writedTo: targets,
          period,
          runAs: user,
          stats: omit(stats, 'path'),
        },
      },
    );
  } catch (error) {
    await slientEditTaskById(task.id, { enabled: false });
    if (writeHistory) {
      await addTaskHistory(task.id, { type: 'generation-error', message: `Rapport "${todayStr}/${filename}" non généré par ${origin} suite à une erreur.` });
    }

    result = merge<ReportResult, DeepPartial<ReportResult>>(
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

export default generateReport;
