import type { Prisma, Task } from '@prisma/client';
import { differenceInMilliseconds, format, parseISO } from 'date-fns';
import Joi from 'joi';
import { compact, merge, omit } from 'lodash';
import { randomUUID } from 'node:crypto';
import EventEmitter from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import config from '../lib/config';
import generatePdfWithVega from '../lib/generators/vegaPDF';
import logger from '../lib/logger';
import { calcNextDate, calcPeriod } from '../lib/recurrence';
import { findInstitutionByIds, findInstitutionContact } from './institutions';
import { isValidLayout, type LayoutFnc } from './layouts';
import { editTaskByIdWithHistory } from './tasks';

const rootPath = config.get('rootPath');
const { outDir } = config.get('pdf');

type ReportResult = {
  success: boolean,
  detail: {
    date: Date,
    time: number,
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
    meta?: unknown
  }
};

const reportresultSchema = Joi.object<ReportResult>({
  success: Joi.boolean().required(),
  detail: Joi.object<ReportResult['detail']>({
    date: Joi.date().iso().required(),
    time: Joi.number().integer().required(),
    task: Joi.string().uuid().required(),
    files: Joi.object<ReportResult['detail']['files']>({
      detail: Joi.string().required(),
      report: Joi.string(),
    }).required(),
    writedTo: Joi.array().items(Joi.string().email()).min(1),
    period: Joi.object<ReportResult['detail']['period']>({
      start: [Joi.date().iso().required(), Joi.number().integer().required()],
      end: [Joi.date().iso().required(), Joi.number().integer().required()],
    }),
    runAs: Joi.string(),
    stats: Joi.object<ReportResult['detail']['stats']>({
      pageCount: Joi.number().integer().required(),
      size: Joi.number().integer().required(),
    }),
    error: Joi.string(),
    meta: Joi.any(),
  }).required(),
});

/**
 * Check if input data is a valid LayoutJSON
 *
 * @param data The input data
 * @returns `true` if valid
 *
 * @throws If not valid
 *
 * @throw If input data isn't a valid LayoutJSON
 */
export const isValidResult = (data: unknown): data is ReportResult => {
  const validation = reportresultSchema.validate(data, {});
  if (validation.error != null) {
    throw new Error(`Result is not valid: ${validation.error.message}`);
  }
  return true;
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
 * @param meta Additional data
 * @param events Event handler (passed to {@link generatePdfWithVega})
 *
 * @returns Job detail
 */
export const generateReport = async (
  task: Task,
  origin: string,
  writeHistory = true,
  debug = false,
  meta = {},
  events: EventEmitter = new EventEmitter(),
): Promise<ReportResult> => {
  const today = new Date();
  const todayStr = format(today, 'yyyy/yyyy-MM');
  const basePath = join(rootPath, outDir, todayStr, '/');

  let filename = `reporting_ezMESURE_${normaliseFilename(task.name)}`;
  if (process.env.NODE_ENV === 'production' || writeHistory) {
    filename += `_${randomUUID()}`;
  }

  logger.debug(`[gen] Generation of report "${todayStr}/${filename}" started`);
  events.emit('creation');

  let result: ReportResult = {
    success: true,
    detail: {
      date: new Date(),
      time: 0,
      task: task.id,
      files: {
        detail: `${todayStr}/${filename}.json`,
      },
      meta,
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
    const contact = (
      // eslint-disable-next-line no-underscore-dangle
      await findInstitutionContact(institution._id.toString())
    ) ?? { _source: null };
    // eslint-disable-next-line no-underscore-dangle
    if (!contact._source) {
      throw new Error(`No suitable contact found for your institution "${task.institution}". Please add doc_contact or tech_contact.`);
    }
    const { _source: { username: user } } = contact;

    // eslint-disable-next-line no-underscore-dangle
    events.emit('contactFound', contact._source);

    // TODO[refactor]: Re-do types InputTask & Task to avoid getting Date instead of string in some cases. Remember that Prisma.TaskCreateInput exists. https://www.prisma.io/docs/concepts/components/prisma-client/advanced-type-safety
    const period = calcPeriod(parseISO(task.nextRun.toString()), task.recurrence);

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

    events.emit('layoutResolved', layout);

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
      events,
    );

    if (writeHistory) {
      await editTaskByIdWithHistory(
        task.id,
        {
          ...task,
          layout: task.layout,
          nextRun: calcNextDate(today, task.recurrence),
          lastRun: today,
        },
        { type: 'generation-success', message: `Rapport "${todayStr}/${filename}" généré par ${origin}`, meta },
      );
    }

    result = merge<ReportResult, DeepPartial<ReportResult>>(
      result,
      {
        detail: {
          time: differenceInMilliseconds(new Date(), result.detail.date),
          files: { report: `${todayStr}/${filename}.pdf` },
          writedTo: targets,
          period,
          runAs: user,
          stats: omit(stats, 'path'),
        },
      },
    );
    logger.info(`[gen] Report "${todayStr}/${filename}" successfully generated in ${(result.detail.time / 1000).toFixed(2)}s`);
  } catch (error) {
    await editTaskByIdWithHistory(
      task.id,
      { ...task, layout: task.layout as Prisma.InputJsonObject, enabled: false },
      writeHistory ? { type: 'generation-error', message: `Rapport "${todayStr}/${filename}" non généré par ${origin} suite à une erreur.`, meta } : undefined,
    );

    result = merge<ReportResult, DeepPartial<ReportResult>>(
      result,
      {
        success: false,
        detail: {
          time: differenceInMilliseconds(new Date(), result.detail.date),
          error: (error as Error).message,
        },
      },
    );
    logger.error(`[gen] Report "${todayStr}/${filename}" failed to generate in ${(result.detail.time / 1000).toFixed(2)}s with error : ${(error as Error).message}`);
  }
  await writeFile(join(basePath, `${filename}.json`), JSON.stringify(result), 'utf-8');
  return result;
};
