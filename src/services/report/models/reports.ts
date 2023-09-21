import { randomUUID } from 'node:crypto';
import EventEmitter from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { compact, merge, omit } from 'lodash';

import fetchWithElastic, { type ElasticFetchOptionsType } from '~/generators/elastic';
import renderPdfWithVega, { type VegaRenderOptionsType } from '~/generators/vega-pdf';

import type { Recurrence, Task } from '~/lib/prisma';
import config from '~/lib/config';
import * as dfns from '~/lib/date-fns';
import { appLogger as logger } from '~/lib/logger';
import { type Static, Type, Value } from '~/lib/typebox';

import { calcNextDate, calcPeriod } from '~/models/recurrence';
import { ConflictError } from '~/types/errors';

import { InputTaskBodyType, patchTaskByIdWithHistory } from './tasks';
import * as templates from './templates';
import { type NamespaceBodyType, NamespaceBody, getNamespaceById } from './namespaces';

const { ttl, outDir } = config.report;

const ReportErrorCause = Type.Object({
  type: Type.Union([
    Type.Literal('fetch'),
    Type.Literal('render'),
    Type.Literal('unknown'),
  ]),
  layout: Type.Integer(),
  figure: Type.Optional(
    Type.Integer(),
  ),
});

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

/**
 * Get report period of task, using custom one if possible
 *
 * @param task The task concerned
 * @param customPeriod The provided custom period
 *
 * @returns
 */
const getReportPeriod = (
  task: Task,
  customPeriod?: { start: string, end: string },
) => {
  if (customPeriod) {
    // Parse custom period
    const parsedPeriod = {
      start: dfns.startOfDay(dfns.parseISO(customPeriod.start)),
      end: dfns.endOfDay(dfns.parseISO(customPeriod.end)),
    };
    // Check if compatible with task
    const expectedPeriodEnd = dfns.add(
      calcNextDate(parsedPeriod.start, task.recurrence),
      { days: -1 },
    );

    if (!dfns.isSameDay(expectedPeriodEnd, parsedPeriod.end)) {
      throw new ConflictError(`Custom period "${customPeriod.start} to ${customPeriod.end}" doesn't match task's recurrence (${task.recurrence}). Should be : "${customPeriod.start} to ${dfns.formatISO(expectedPeriodEnd)}")`);
    }

    return parsedPeriod;
  }

  // TODO[refactor]: Re-do types InputTask & Task to avoid getting Date instead of string in some cases. Remember that Prisma.TaskCreateInput exists. https://www.prisma.io/docs/concepts/components/prisma-client/advanced-type-safety
  return calcPeriod(dfns.parseISO(task.nextRun.toString()), task.recurrence);
};

/**
 * Shorthand to fetch data of layouts
 *
 * @param params The params of the function
 * @param events The event manager passed to fetcher
 *
 * @returns Promise with all requests
 */
const fetchData = (
  params: {
    /** The resolved template */
    template: templates.TemplateType,
    /** The template of the task */
    taskTemplate: templates.TaskTemplateType,
    /** Period of the report */
    period: Interval,
    /** Namespace of the report */
    namespace?: NamespaceBodyType,
    /** Recurrence of task */
    recurrence: Recurrence
  },
  events: EventEmitter,
): Promise<{
  /** index of the layout */
  index: number,
  /** data fetched */
  data: unknown,
  /** resolved options of fetcher */
  options?: ElasticFetchOptionsType
}[]> => {
  const {
    template,
    taskTemplate,
    period,
    namespace,
    recurrence,
  } = params;

  return Promise.all(
    template.layouts.map(async (layout, i) => {
      // If there's static data, do not request it
      if (
        layout.data
        || layout.figures.every(({ data }) => !!data)
      ) {
        return {
          index: i,
          data: layout.data,
        };
      }

      const fetchOptions: ElasticFetchOptionsType = merge(
        {},
        template.fetchOptions ?? {},
        layout.fetchOptions ?? {},
        {
          dateField: template.fetchOptions?.dateField ?? '',
          ...(taskTemplate.fetchOptions ?? {}),
          recurrence,
          period: {
            start: dfns.getTime(period.start),
            end: dfns.getTime(period.end),
          },
          auth: namespace?.fetchLogin?.elastic ?? { username: '' },
        },
      );

      // Fetch elastic and return resolved fetch options
      try {
        return {
          index: i,
          options: fetchOptions,
          data: await fetchWithElastic(fetchOptions, events),
        };
      } catch (error) {
        if (!(error instanceof Error)) {
          throw error;
        }
        error.cause = { ...(error.cause ?? {}), layout: i, type: 'fetch' };
        throw error;
      }
    }),
  );
};

/**
 * Shorthand to render layouts
 *
 * @param params The params of the function
 * @param events The event manager passed to fetcher
 *
 * @returns Promise with resolved
 */
const renderTemplate = async (
  params: {
    /** Render options of template */
    baseRenderOptions: templates.TemplateType['renderOptions'],
    /** Layouts of template */
    layouts: templates.TemplateType['layouts'],
    /** Concerned task */
    task: Task,
    /** Filepath of report */
    path: string,
    /** Period of report */
    period: Interval,
    /** Is debug active */
    debug?: boolean,
  },
  events: EventEmitter,
) => {
  const {
    baseRenderOptions,
    task,
    path,
    period,
    debug,
    layouts,
  } = params;

  const renderOptions: VegaRenderOptionsType = merge(
    {},
    baseRenderOptions ?? {},
    {
      doc: {
        name: task.name,
        path,
        period: {
          start: dfns.getTime(period.start),
          end: dfns.getTime(period.end),
        },
      },
      recurrence: task.recurrence,
      debug,
      layouts,
    },
  );

  return {
    options: renderOptions,
    stats: await renderPdfWithVega(renderOptions, events),
  };
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

  const namespace = Value.Cast(
    NamespaceBody,
    await getNamespaceById(task.namespaceId),
  );
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

    const period = getReportPeriod(task, customPeriod);
    const distance = dfns.differenceInMilliseconds(period.end, period.start);
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

    // Fetch data and keep resolved data and fetch options
    const requestsResults = await fetchData(
      {
        template,
        taskTemplate,
        period,
        recurrence: task.recurrence,
        namespace,
      },
      events,
    );
    // eslint-disable-next-line no-restricted-syntax
    for (const { index, data, options } of requestsResults) {
      template.layouts[index].fetchOptions = options;
      template.layouts[index].data = data;
    }

    // Cleanup & notifications
    delete template.fetchOptions;
    events.emit('templateFetched', template);
    logger.verbose(`[gen] [${process.pid}] Data fetched`);

    // Render report
    const renderResult = await renderTemplate(
      {
        baseRenderOptions: template.renderOptions,
        layouts: template.layouts,
        task,
        path: `${filepath}.rep`,
        period,
        debug,
      },
      events,
    );
    template.renderOptions = renderResult.options;
    result.detail.files.report = `${namepath}.rep.pdf`;
    logger.verbose(`[gen] [${process.pid}] Report wrote to "${result.detail.files.report}"`);

    // Update result
    result.detail = {
      ...result.detail,
      took: dfns.differenceInMilliseconds(new Date(), today),
      sendingTo: targets,
      stats: omit(renderResult.stats, 'path'),
    };

    logger.info(`[gen] [${process.pid}] Report "${namepath}" successfully generated in ${(result.detail.took / 1000).toFixed(2)}s`);
  } catch (error) {
    const err: ReportResultType['detail']['error'] = {
      message: `${error}`,
      stack: [],
      cause: {
        layout: -1,
        type: 'unknown',
      },
    };

    // Parse error
    if (error instanceof Error) {
      err.message = error.message;
      err.stack = error.stack?.split('\n    ') ?? [];
      err.cause = Value.Cast(ReportErrorCause, err.cause);
    }

    // Update result
    result.success = false;
    result.detail = {
      ...result.detail,
      took: dfns.differenceInMilliseconds(new Date(), today),
      error: err,
    };

    const dur = (result.detail.took / 1000).toFixed(2);
    if (error instanceof Error) {
      logger.error(`[gen] [${process.pid}] Report [${namepath}] failed to generate in [${dur}]s with error: {${error.message}}`);
    } else {
      logger.error(`[gen] [${process.pid}] An unexpected error occurred [${namepath}] failed to generate in [${dur}]s with error: {${error}}`);
    }
  }

  // Update task if needed
  if (writeHistory) {
    // Default data
    let taskData: Partial<InputTaskBodyType> & { lastRun: Date } = {
      lastRun: today,
    };
    const activityData = {
      type: '',
      message: '',
      data: {
        ...meta,
        destroyAt: result.detail.destroyAt,
        files: result.detail.files,
        period: undefined as { start: string, end: string } | undefined,
      },
    };

    if (result.success) {
      // If generation is a success
      taskData = {
        ...taskData,
        nextRun: calcNextDate(today, task.recurrence).toISOString(),
      };

      activityData.type = 'generation-success';
      activityData.message = `Rapport "${namepath}" généré par ${origin}`;
      activityData.data.period = result.detail.period;
    } else {
      // If an error was throw when generating
      taskData = {
        ...taskData,
        enabled: false,
      };

      activityData.type = 'generation-error';
      activityData.message = `Rapport "${namepath}" non généré par ${origin} suite à une erreur.`;
    }

    // Apply modifications
    try {
      await patchTaskByIdWithHistory(
        task.id,
        taskData,
        activityData,
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`[gen] [${process.pid}] Unable to update task [${task.id}]: {${error.message}}`);
      } else {
        logger.error(`[gen] [${process.pid}] An unexpected error occurred when updating task [${task.id}]: {${error}}`);
      }
    }
  }

  // Write detail when process is ending
  try {
    await writeInfoFile(`${filepath}.det`, result);
    logger.verbose(`[gen] [${process.pid}] Detail wrote to [${result.detail.files.detail}]`);
    result.detail.files.detail = `${namepath}.deb.json`;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`[gen] [${process.pid}] Unable to write detail [${task.id}]: {${error.message}}`);
    } else {
      logger.error(`[gen] [${process.pid}] An unexpected error occurred when writing detail [${task.id}]: {${error}}`);
    }
  }

  // Write debug when process is ending
  try {
    await writeInfoFile(`${filepath}.deb`, omit(template, 'renderOptions.layouts'));
    result.detail.files.debug = `${namepath}.deb.json`;
    logger.verbose(`[gen] [${process.pid}] Template wrote to [${result.detail.files.debug}]`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`[gen] [${process.pid}] Unable to write debug [${task.id}]: {${error.message}}`);
    } else {
      logger.error(`[gen] [${process.pid}] An unexpected error occurred when writing debug [${task.id}]: {${error}}`);
    }
  }

  return result;
};
