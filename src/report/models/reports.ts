import type { Prisma, Task } from '@prisma/client';
import {
  add,
  differenceInMilliseconds,
  endOfDay,
  format,
  formatISO,
  parseISO,
  startOfDay
} from 'date-fns';
import Joi from 'joi';
import { compact, merge, omit } from 'lodash';
import { randomUUID } from 'node:crypto';
import EventEmitter from 'node:events';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import config from '../lib/config';
import fetchers, { type Fetchers } from '../lib/generators/fetchers';
import renderers, { type Renderers } from '../lib/generators/renderers';
import logger from '../lib/logger';
import { calcNextDate, calcPeriod } from '../lib/recurrence';
import { ArgumentError, ConflitError } from '../types/errors';
import { findInstitutionByIds, findInstitutionContact } from './institutions';
import { editTaskByIdWithHistory } from './tasks';
import { isNewTemplate, isNewTemplateDB } from './templates';

const { ttl, templatesDir, outDir } = config.get('report');

type ReportResult = {
  success: boolean,
  detail: {
    createdAt: Date,
    destroyAt: Date,
    took: number,
    taskId: Task['id'],
    files: {
      detail: string,
      report?: string,
      debug?: string,
    },
    sendingTo?: string[],
    period?: Interval,
    runAs?: string,
    stats?: Omit<Awaited<ReturnType<Renderers[keyof Renderers]>>, 'path'>,
    error?: {
      message: string,
      stack: string[]
    },
    meta?: unknown
  }
};

const reportresultSchema = Joi.object<ReportResult>({
  success: Joi.boolean().required(),
  detail: Joi.object<ReportResult['detail']>({
    createdAt: Joi.date().iso().required(),
    destroyAt: Joi.date().iso().required(),
    took: Joi.number().integer().required(),
    taskId: Joi.string().uuid().required(),
    files: Joi.object<ReportResult['detail']['files']>({
      detail: Joi.string().required(),
      report: Joi.string(),
      debug: Joi.string(),
    }).required(),
    sendingTo: Joi.array().items(Joi.string().email()).min(1),
    period: Joi.object<ReportResult['detail']['period']>({
      start: [Joi.date().iso().required(), Joi.number().integer().required()],
      end: [Joi.date().iso().required(), Joi.number().integer().required()],
    }),
    runAs: Joi.string(),
    stats: Joi.object<ReportResult['detail']['stats']>({
      pageCount: Joi.number().integer().required(),
      size: Joi.number().integer().required(),
    }),
    error: Joi.object<ReportResult['detail']['error']>({
      message: Joi.string().required(),
      stack: Joi.array().items(Joi.string()).required(),
    }),
    meta: Joi.any(),
  }).required(),
});

/**
 * Check if input data is a valid ReportResult
 *
 * @param data The input data
 * @returns `true` if valid
 *
 * @throws If not valid
 *
 * @throw If input data isn't a valid ReportResult
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
  customPeriod?: { start: string, end: string },
  writeHistory = true,
  debug = false,
  meta = {},
  events: EventEmitter = new EventEmitter(),
): Promise<ReportResult> => {
  const today = new Date();
  const todayStr = format(today, 'yyyy/yyyy-MM');
  const basePath = join(outDir, todayStr, '/');

  let filename = `reporting_ezMESURE_${normaliseFilename(task.name)}`;
  if (process.env.NODE_ENV === 'production' || writeHistory) {
    filename += `_${randomUUID()}`;
  }
  const filepath = join(basePath, filename);
  const namepath = `${todayStr}/${filename}`;

  logger.debug(`[gen] Generation of report "${namepath}" started`);
  events.emit('creation');

  let result: ReportResult = {
    success: true,
    detail: {
      createdAt: today,
      destroyAt: add(today, { days: ttl.days }),
      took: 0,
      taskId: task.id,
      files: {
        detail: `${namepath}.det.json`,
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
    result.detail.runAs = user;

    // eslint-disable-next-line no-underscore-dangle
    events.emit('contactFound', contact._source);

    // TODO[refactor]: Re-do types InputTask & Task to avoid getting Date instead of string in some cases. Remember that Prisma.TaskCreateInput exists. https://www.prisma.io/docs/concepts/components/prisma-client/advanced-type-safety
    let period = calcPeriod(parseISO(task.nextRun.toString()), task.recurrence);
    const distance = differenceInMilliseconds(period.end, period.start);

    if (customPeriod) {
      const cp = {
        start: startOfDay(parseISO(customPeriod.start)),
        end: endOfDay(parseISO(customPeriod.end)),
      };
      if (differenceInMilliseconds(cp.end, cp.start) !== distance) {
        throw new ConflitError(`Custom period "${customPeriod.start} to ${customPeriod.end}" doesn't match task's recurrence (${task.recurrence} : "${formatISO(period.start)} to ${formatISO(period.end)}")`);
      }
      period = cp;
    }
    result.detail.period = period;

    // Re-calc ttl if not in any debug mode
    if (writeHistory && !debug) {
      result.detail.destroyAt = add(today, { seconds: ttl.iterations * (distance / 1000) });
    }

    const taskTemplate = task.template;
    if (!isNewTemplateDB(taskTemplate) || (typeof taskTemplate !== 'object' || Array.isArray(taskTemplate))) {
      // As validation throws an error, this line should be called only if 2nd assertion fails
      throw new ArgumentError("Task's template is not an object");
    }

    // Check if not trying to access unwanted file
    const extendsPath = join(templatesDir, `${taskTemplate.extends}.json`);
    if (new RegExp(`^${templatesDir}/.*\\.json$`, 'i').test(extendsPath) === false) {
      throw new Error(`Task's layout must be in the "${templatesDir}" folder. Resolved: "${extendsPath}"`);
    }

    // Resolve import
    const template = JSON.parse(await readFile(extendsPath, 'utf-8'));
    if (!isNewTemplate(template)) {
      // As validation throws an error, this line shouldn't be called
      return {} as ReportResult;
    }

    // Insert task's layouts
    if (taskTemplate.inserts) {
      // eslint-disable-next-line no-restricted-syntax
      for (const { at, ...layout } of taskTemplate.inserts) {
        template.layouts.splice(at, 0, layout);
      }
    }

    events.emit('templateResolved', template);

    // Fetch data
    await Promise.all(
      template.layouts.map(async (layout, i) => {
        if (
          layout.data || layout.figures.every(({ data }) => !!data)
        ) {
          return;
        }
        const fetchOptions: GeneratorParam<Fetchers, keyof Fetchers> = merge(
          template.fetchOptions ?? {},
          layout.fetchOptions ?? {},
          {
            indexSuffix: '',
            ...(taskTemplate.fetchOptions ?? { }),
            recurrence: task.recurrence,
            period,
            // template,
            // eslint-disable-next-line no-underscore-dangle
            indexPrefix: institution._source?.institution.indexPrefix ?? '*',
            user,
          },
        );
        template.layouts[i].fetchOptions = fetchOptions;
        template.layouts[i].data = await fetchers[layout.fetcher ?? 'elastic'](fetchOptions, events);
      }),
    );
    // Cleanup resolved resolvedTemplate
    delete template.fetchOptions;
    events.emit('templateFetched', template);

    // Render report
    const renderOptions: GeneratorParam<Renderers, keyof Renderers> = merge(
      template.renderOptions ?? {},
      {
        doc: {
          name: task.name,
          path: `${filepath}.rep`,
          period,
        },
        recurrence: task.recurrence,
        debug,
        layouts: template.layouts,
      },
    );
    template.renderOptions = renderOptions;
    const stats = await renderers[template.renderer ?? 'vega-pdf'](renderOptions, events);
    logger.debug(`[gen] Report wroted to "${namepath}.rep.pdf"`);

    await writeFile(
      `${filepath}.deb.json`,
      JSON.stringify(
        { ...template, renderOptions: { ...omit(template.renderOptions, 'layouts') } },
        undefined,
        process.env.NODE_ENV !== 'production' ? 2 : undefined,
      ),
      'utf-8',
    );
    result.detail.files.debug = `${namepath}.deb.json`;
    logger.debug(`[gen] Template writed to "${namepath}.deb.json"`);

    if (writeHistory) {
      await editTaskByIdWithHistory(
        task.id,
        {
          ...task,
          template: task.template as Prisma.InputJsonObject,
          nextRun: calcNextDate(today, task.recurrence),
          lastRun: today,
        },
        {
          type: 'generation-success',
          message: `Rapport "${namepath}" généré par ${origin}`,
          data: {
            ...meta,
            period: {
              start: formatISO(period.start),
              end: formatISO(period.end),
            },
          },
        },
      );
    }

    result = merge<ReportResult, DeepPartial<ReportResult>>(
      result,
      {
        detail: {
          took: differenceInMilliseconds(new Date(), result.detail.createdAt),
          files: {
            report: `${namepath}.rep.pdf`,
          },
          sendingTo: targets,
          stats: omit(stats, 'path'),
        },
      },
    );
    logger.info(`[gen] Report "${namepath}" successfully generated in ${(result.detail.took / 1000).toFixed(2)}s`);
  } catch (error) {
    if (writeHistory) {
      await editTaskByIdWithHistory(
        task.id,
        {
          ...task,
          template: task.template as Prisma.InputJsonObject,
          enabled: false,
        },
        writeHistory ? { type: 'generation-error', message: `Rapport "${namepath}" non généré par ${origin} suite à une erreur.`, data: meta } : undefined,
      );
    }

    result = merge<ReportResult, DeepPartial<ReportResult>>(
      result,
      {
        success: false,
        detail: {
          took: differenceInMilliseconds(new Date(), result.detail.createdAt),
          error: {
            message: (error as Error).message,
            stack: (error as Error).stack?.split('\n    '),
          },
        },
      },
    );
    logger.error(`[gen] Report "${namepath}" failed to generate in ${(result.detail.took / 1000).toFixed(2)}s with error : ${(error as Error).message}`);
  }
  await writeFile(
    `${filepath}.det.json`,
    JSON.stringify(
      result,
      undefined,
      process.env.NODE_ENV !== 'production' ? 2 : undefined,
    ),
    'utf-8',
  );
  return result;
};
