import type { Task } from '@prisma/client';
import { format } from 'date-fns';
import { merge } from 'lodash';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import config from '../lib/config';
import generatePdfWithVega from '../lib/generators/vegaPDF';
import { calcNextDate, calcPeriod } from '../lib/recurrence';
import { findInstitutionByIds, findInstitutionContact } from './institutions';
import { isValidLayout, LayoutFnc } from './layouts';
import { addTaskHistory, slientEditTaskById } from './tasks';

const rootPath = config.get('rootPath');
const { outDir } = config.get('pdf');

type ReportResult = {
  success: boolean,
  detail: any
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

export default generateReport;
