import { randomUUID } from 'node:crypto';
import EventEmitter from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { compact, merge, omit } from 'lodash';

import fetchWithElastic, { ElasticFetchOptions } from '~/generators/elastic';
import renderPdfWithVega, { VegaRenderOptions } from '~/generators/vega-pdf';

import type { Recurrence, Task } from '~/lib/prisma';
import config from '~/lib/config';
import * as dfns from '~/lib/date-fns';
import { appLogger as logger } from '~/lib/logger';
import { type Static, Type, Value } from '~/lib/typebox';

import { calcNextDate, calcPeriod } from '~/models/recurrence';
import { ConflictError } from '~/types/errors';

import { patchTaskByIdWithHistory } from './tasks';
import * as templates from './templates';
import { type TypedNamespace, getNamespaceById } from './namespaces';

const { ttl, outDir } = config.report;

const ReportErrorCause = Type.Object({
  type: Type.Union([
    Type.Literal('fetch'),
    Type.Literal('render'),
  ]),
  layout: Type.Integer(),
  figure: Type.Optional(
    Type.Integer(),
  ),
});

type ReportErrorCauseType = Static<typeof ReportErrorCause>;

export const ReportResult = Type.Object({
  success: Type.Boolean(),

  detail: Type.Object({
    createdAt: Type.String({ /* format: 'date-time' */ }),

    destroyAt: Type.String({ /* format: 'date-time' */ }),

    took: Type.Integer(),

    taskId: Type.String(),

    files: Type.Object({
      detail: Type.String(),

      report: Type.Optional(
        Type.String(),
      ),

      debug: Type.Optional(
        Type.String(),
      ),
    }),

    sendingTo: Type.Optional(
      Type.Array(
        Type.String({ /* format: 'email' */ }),
      ),
    ),

    period: Type.Optional(
      Type.Object({
        start: Type.String({ /* format: 'date-time' */ }),

        end: Type.String({ /* format: 'date-time' */ }),
      }),
    ),

    auth: Type.Optional(
      Type.Object({
        elastic: Type.Optional(
          Type.Object({
            username: Type.String(),
          }),
        ),
      }),
    ),

    stats: Type.Optional(
      Type.Object({
        pageCount: Type.Integer(),

        path: Type.String(),

        size: Type.Integer(),
      }),
    ),

    error: Type.Optional(
      Type.Object({
        message: Type.String(),

        stack: Type.Array(
          Type.String(),
        ),

        cause: ReportErrorCause,
      }),
    ),

    meta: Type.Any(),
  }),
});

export type ReportResultType = Static<typeof ReportResult>;

/**
 * Put filename in lowercase & remove chars that can cause issues.
 *
 * @param filename The original filename
 *
 * @returns The normalized filename
 */
const normaliseFilename = (filename: string): string => filename.toLowerCase().replace(/[/ .]/g, '-');

/**
 * Shorthand to write JSON data about generation
 *
 * @param name The name of the file **without extension*
 * @param content The content to write
 */
const writeInfoFile = (name: string, content: unknown) => writeFile(
  `${name}.json`,
  JSON.stringify(
    content,
    undefined,
    process.env.NODE_ENV !== 'production' ? 2 : undefined,
  ),
  'utf-8',
);

type FetchParams = {
  template: templates.TemplateType,
  taskTemplate: templates.TaskTemplateType,
  period: Interval,
  namespace?: TypedNamespace,
  recurrence: Recurrence
};

const fetchData = (params: FetchParams, events: EventEmitter) => {
  const {
    template,
    taskTemplate,
    period,
    namespace,
    recurrence,
  } = params;

  return Promise.all(
    template.layouts.map(async (layout, i) => {
      if (
        layout.data || layout.figures.every(({ data }) => !!data)
      ) {
        return;
      }
      const fetchOptions: ElasticFetchOptions = merge(
        {},
        template.fetchOptions ?? {},
        layout.fetchOptions ?? {},
        {
          dateField: template.fetchOptions?.dateField ?? '',
          ...(taskTemplate.fetchOptions ?? {}),
          recurrence,
          period,
          indexPrefix: namespace?.fetchOptions?.elastic?.indexPrefix,
          auth: namespace?.fetchLogin?.elastic ?? { username: '' },
        },
      );
      template.layouts[i].fetchOptions = fetchOptions;

      try {
        template.layouts[i].data = await fetchWithElastic(fetchOptions, events);
      } catch (error) {
        const err = error as Error;
        err.cause = { ...(err.cause ?? {}), layout: i, type: 'fetch' };
        throw err;
      }
    }),
  );
};

/**
 * Generate report
 *
 * @param task The task to generate
 * @param origin The origin of the generation (can be username, or method (auto, etc.))
 * @param writeHistory Should write generation in task history (also disable first level of debug)
 * @param debug Enable second level of debug
 * @param meta Additional data
 * @param events Event handler (passed to {@link renderPdfWithVega})
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
): Promise<ReportResultType> => {
  const today = new Date();
  const todayStr = dfns.format(today, 'yyyy/yyyy-MM');
  const basePath = join(outDir, todayStr, '/');

  let filename = `ezREEPORT_${normaliseFilename(task.name)}`;
  if (process.env.NODE_ENV === 'production' || writeHistory) {
    filename += `_${randomUUID()}`;
  }
  const filepath = join(basePath, filename);
  const namepath = `${todayStr}/${filename}`;

  const namespace = await getNamespaceById(task.namespaceId) as TypedNamespace;
  if (!namespace) {
    throw new Error(`Namespace "${task.namespaceId}" not found`);
  }

  logger.verbose(`[gen] [${process.pid}] Generation of report "${namepath}" started`);
  events.emit('creation');

  const result: ReportResultType = {
    success: true,
    detail: {
      createdAt: today.toISOString(),
      destroyAt: dfns.add(today, { days: ttl.days }).toISOString(),
      took: 0,
      taskId: task.id,
      files: {
        detail: `${namepath}.det.json`,
      },
      meta,
    },
  };

  await mkdir(basePath, { recursive: true });

  let template: templates.TemplateType | null = null;

  try {
    const targets = compact(task.targets);
    if (targets.length <= 0) {
      throw new Error("Targets can't be null");
    }

    result.detail.auth = namespace.fetchLogin;
    events.emit('authFound', result.detail.auth);

    // TODO[refactor]: Re-do types InputTask & Task to avoid getting Date instead of string in some cases. Remember that Prisma.TaskCreateInput exists. https://www.prisma.io/docs/concepts/components/prisma-client/advanced-type-safety
    let period = calcPeriod(dfns.parseISO(task.nextRun.toString()), task.recurrence);
    const distance = dfns.differenceInMilliseconds(period.end, period.start);

    // Parse custom period
    if (customPeriod) {
      const parsedPeriod = {
        start: dfns.startOfDay(dfns.parseISO(customPeriod.start)),
        end: dfns.endOfDay(dfns.parseISO(customPeriod.end)),
      };
      const expectedPeriodEnd = dfns.add(
        calcNextDate(parsedPeriod.start, task.recurrence),
        { days: -1 },
      );
      if (!dfns.isSameDay(expectedPeriodEnd, parsedPeriod.end)) {
        throw new ConflictError(`Custom period "${customPeriod.start} to ${customPeriod.end}" doesn't match task's recurrence (${task.recurrence}). Should be : "${customPeriod.start} to ${dfns.formatISO(expectedPeriodEnd)}")`);
      }
      period = parsedPeriod;
    }
    result.detail.period = {
      start: new Date(period.start).toISOString(),
      end: new Date(period.end).toISOString(),
    };

    // Re-calc ttl if not in any debug mode
    if (writeHistory && !debug) {
      result.detail.destroyAt = dfns
        .add(today, { seconds: ttl.iterations * (distance / 1000) })
        .toISOString();
    }

    // Parse task template
    const taskTemplate = Value.Cast(templates.TaskTemplate, task.template);
    ({ body: template } = await templates.getTemplateById(task.extendedId) ?? { body: null });

    if (!template) {
      throw new Error(`No template "${task.extendedId}" was found`);
    }

    // Insert task's layouts
    if (taskTemplate.inserts) {
      // eslint-disable-next-line no-restricted-syntax
      for (const { at, ...layout } of taskTemplate.inserts) {
        template.layouts.splice(at, 0, layout);
      }
    }

    events.emit('templateResolved', template);

    await fetchData({
      template,
      taskTemplate,
      period,
      recurrence: task.recurrence,
      namespace,
    }, events);
    // Cleanup
    delete template.fetchOptions;
    events.emit('templateFetched', template);
    logger.verbose(`[gen] [${process.pid}] Data fetched`);

    // Render report
    const renderOptions: VegaRenderOptions = merge(
      {},
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
    const stats = await renderPdfWithVega(renderOptions, events);
    result.detail.files.report = `${namepath}.rep.pdf`;
    logger.verbose(`[gen] [${process.pid}] Report wrote to "${result.detail.files.report}"`);

    merge<ReportResultType, DeepPartial<ReportResultType>>(
      result,
      {
        detail: {
          took: dfns.differenceInMilliseconds(new Date(), today),
          sendingTo: targets,
          stats: omit(stats, 'path'),
        },
      },
    );

    if (writeHistory) {
      await patchTaskByIdWithHistory(
        task.id,
        { nextRun: calcNextDate(today, task.recurrence).toString(), lastRun: today },
        {
          type: 'generation-success',
          message: `Rapport "${namepath}" généré par ${origin}`,
          data: {
            ...meta,
            destroyAt: result.detail.destroyAt,
            files: result.detail.files,
            period: {
              start: dfns.formatISO(period.start),
              end: dfns.formatISO(period.end),
            },
          },
        },
      );
    }

    logger.info(`[gen] [${process.pid}] Report "${namepath}" successfully generated in ${(result.detail.took / 1000).toFixed(2)}s`);
  } catch (error) {
    const err = error as Error;
    merge<ReportResultType, DeepPartial<ReportResultType>>(
      result,
      {
        success: false,
        detail: {
          took: dfns.differenceInMilliseconds(new Date(), today),
          error: {
            message: err.message,
            stack: err.stack?.split('\n    '),
            cause: err.cause as ReportErrorCauseType,
          },
        },
      },
    );

    if (writeHistory) {
      await patchTaskByIdWithHistory(
        task.id,
        { enabled: false },
        {
          type: 'generation-error',
          message: `Rapport "${namepath}" non généré par ${origin} suite à une erreur.`,
          data: {
            ...meta,
            destroyAt: result.detail.destroyAt,
            files: result.detail.files,
          },
        },
      );
    }
    logger.error(`[gen] [${process.pid}] Report "${namepath}" failed to generate in ${(result.detail.took / 1000).toFixed(2)}s with error : ${(error as Error).message}`);
  }

  // Write debug when process is ending
  await writeInfoFile(`${filepath}.deb`, omit(template, 'renderOptions.layouts'));
  result.detail.files.debug = `${namepath}.deb.json`;
  logger.verbose(`[gen] [${process.pid}] Template wrote to "${result.detail.files.debug}"`);

  // Write detail when process is ending
  await writeInfoFile(`${filepath}.det`, result);
  logger.verbose(`[gen] [${process.pid}] Detail wrote to "${result.detail.files.detail}"`);
  return result;
};
