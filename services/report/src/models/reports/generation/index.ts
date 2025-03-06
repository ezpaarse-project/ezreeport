import EventEmitter from 'node:events';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

import { compact, omit } from 'lodash';

import * as dfns from '~/lib/date-fns';
import { appLogger as logger } from '~/lib/logger';
import config from '~/lib/config';
import { asyncWithCommonHandlers } from '~/lib/utils';

import { ConflictError } from '~/types/errors';

import { getTemplate } from '~/models/templates';
import type { TemplateBodyType } from '~/models/templates/types';
import { getTask, editTaskAfterGeneration } from '~/models/tasks';
import type { TaskType } from '~/models/tasks/types';
import { createActivity } from '~/models/task-activity';
import type { InputTaskActivityType } from '~/models/task-activity/types';
import { getNamespace } from '~/models/namespaces';
import { calcNextDateFromRecurrence, calcPeriodFromRecurrence } from '~/models/recurrence';

import { ReportErrorCause, type ReportPeriodType, type ReportResultType } from '../types';
import { fetchElastic } from './fetch';
import renderPdfWithVega from './render';

const { ttl, outDir } = config.report;

/**
 * Prepare report by ensuring paths, namespace and prepare result
 *
 * @param task The task
 * @param startTime When the generation started
 * @param writeActivity If we should write activity
 * @param meta Additional meta to init result
 *
 * @returns The namespace, the paths and the initial result
 */
async function prepareReport(
  task: Omit<TaskType, 'template'>,
  startTime = new Date(),
  writeActivity = true,
  meta = {},
) {
  // Prepare file paths
  const todayStr = dfns.format(startTime, 'yyyy/yyyy-MM');
  const basePath = join(outDir, todayStr, '/');

  let filename = `ezREEPORT_${task.name.toLowerCase().replace(/[/ .]/g, '-')}`;
  if (process.env.NODE_ENV === 'production' || writeActivity) {
    filename += `_${randomUUID()}`;
  }
  const filepath = join(basePath, filename);
  const namepath = `${todayStr}/${filename}`;

  // Get namespace
  const namespace = await getNamespace(task.namespaceId);
  if (!namespace) {
    throw new Error(`Namespace "${task.namespaceId}" not found`);
  }

  // Prepare result
  const result: ReportResultType = {
    success: true,
    detail: {
      createdAt: startTime,
      destroyAt: dfns.add(startTime, { days: ttl.days }),
      took: 0,
      taskId: task.id,
      files: {
        detail: `${namepath}.det.json`,
      },
      meta,
    },
  };

  await mkdir(basePath, { recursive: true });

  return {
    namespace,
    result,
    paths: {
      filepath,
      namepath,
    },
  };
}

/**
 * Get report period of task, using custom one if possible
 *
 * @param task The task concerned
 * @param customPeriod The provided custom period
 *
 * @returns
 */
function resolveReportPeriod(
  task: Omit<TaskType, 'template'>,
  customPeriod?: ReportPeriodType,
): ReportPeriodType {
  if (!customPeriod) {
    return calcPeriodFromRecurrence(new Date(), task.recurrence, -1);
  }

  // Parse custom period
  const parsedPeriod = {
    start: dfns.startOfDay(customPeriod.start),
    end: dfns.endOfDay(customPeriod.end),
  };

  // Check if compatible with task
  const expectedPeriodEnd = dfns.endOfDay(
    dfns.add(
      calcNextDateFromRecurrence(parsedPeriod.start, task.recurrence),
      { days: -1 },
    ),
  );

  if (!dfns.isSameDay(expectedPeriodEnd, parsedPeriod.end)) {
    const isoFormat = "yyyy-MM-dd'T'HH:mm:ssXXXXX";
    const isoStart = dfns.format(parsedPeriod.start, isoFormat);
    const isoParsedEnd = dfns.format(parsedPeriod.end, isoFormat);
    const isoEnd = dfns.format(expectedPeriodEnd, isoFormat);

    throw new ConflictError(`Custom period "${isoStart} to ${isoParsedEnd}" doesn't match task's recurrence (${task.recurrence}). Should be : "${isoStart} to ${isoEnd}")`);
  }

  return parsedPeriod;
}

/**
 * Resolve whole report template
 *
 * @param task The task concerned
 *
 * @returns Resolved template
 */
async function resolveReportTemplate({ id }: Omit<TaskType, 'template'>) {
  const task = await getTask(id);
  if (!task) {
    throw new Error(`No task ${id} was found`);
  }

  const template = await getTemplate(task.extendedId);
  if (!template) {
    throw new Error(`No template ${task.extendedId} was found`);
  }

  // Check version
  if (template.body.version !== task.template.version || template.body.version !== 2) {
    throw new Error(`Resolved template's (template.v${template.body.version}: ${task.extendedId}, task.v${task.template.version}: ${task.name}) is not compatible with task`);
  }

  // Use task's index
  template.body.index = task.template.index || undefined;

  // Use task's date field if provided
  if (task.template.dateField) {
    template.body.dateField = task.template.dateField;
  }

  // Merge task's filters if provided
  if (task.template.filters) {
    template.body.filters = template.body.filters ?? [];
    template.body.filters.push(...task.template.filters);
  }

  // Insert task's layouts if provided
  if (task.template.inserts) {
    // eslint-disable-next-line no-restricted-syntax
    for (const { at, ...layout } of task.template.inserts) {
      template.body.layouts.splice(at, 0, layout);
    }
  }

  return template.body;
}

/**
 * Handle errors that happen while generating, and put it in result
 *
 * @param error The error
 * @param result The result
 * @param paths The paths
 * @param startTime When the generation started
 */
function handleReportError(
  error: unknown,
  result: ReportResultType,
  paths: { namepath: string },
  startTime = new Date(),
) {
  const err: ReportResultType['detail']['error'] = {
    message: `${error}`,
    stack: [],
    cause: {
      type: 'unknown',
    },
  };

  // Parse error
  if (error instanceof Error) {
    err.message = error.message;
    err.stack = error.stack?.split('\n    ') ?? [];
    const { data: cause, error: validationError } = ReportErrorCause.safeParse(error.cause);
    if (cause) {
      err.cause = cause;
    } else {
      logger.error({
        msg: 'Failed to parse error cause',
        cause: err.cause,
        err: validationError,
      });
    }
  }

  // Update result
  const r = result;
  r.success = false;
  r.detail = {
    ...result.detail,
    took: dfns.differenceInMilliseconds(new Date(), startTime),
    error: err,
  };

  logger.error({
    reportPath: result.detail.files.report,
    genDuration: result.detail.took,
    genDurationUnit: 'ms',
    err: {
      message: err.message,
      stack: err.stack,
      cause: {
        ...err.cause,
        elasticQuery: undefined,
        vegaSpec: undefined,
      },
    },
    msg: 'Report failed to generate',
  });
}

/**
 * Write report activity into DB
 *
 * @param task The task
 * @param origin The origin of generation
 * @param result The result
 * @param paths The paths
 * @param startTime When the generation started
 * @param meta Additional meta to activity
 */
async function writeReportActivity(
  task: Omit<TaskType, 'template'>,
  origin: string,
  result: ReportResultType,
  paths: { namepath: string },
  startTime = new Date(),
  meta = {},
) {
  // Task data to update
  const taskLastRun = startTime;
  let taskNextRun: Date | undefined;
  let isTaskEnabled: boolean | undefined;

  const activityData: InputTaskActivityType = {
    taskId: task.id,
    type: '',
    message: '',
    data: {
      ...meta,
      targets: compact(task.targets),
      destroyAt: result.detail.destroyAt,
      files: result.detail.files,
      period: undefined as { start: string, end: string } | undefined,
    },
  };

  if (result.success) {
    // If generation is a success
    taskNextRun = calcNextDateFromRecurrence(startTime, task.recurrence);

    activityData.type = 'generation:success';
    activityData.message = `Rapport "${paths.namepath}" généré par ${origin}`;
    activityData.data!.period = result.detail.period;
  } else {
    // If an error was throw when generating
    isTaskEnabled = false;

    activityData.type = 'generation:error';
    activityData.message = `Rapport "${paths.namepath}" non généré par ${origin} suite à une erreur.`;
  }

  try {
    // Apply modifications
    await editTaskAfterGeneration(task.id, taskLastRun, taskNextRun, isTaskEnabled);
    await createActivity(activityData);
  } catch (err) {
    logger.error({
      err,
      msg: 'Unable to update task',
    });
  }
}

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
 * Generate report
 *
 * @param task The task to generate
 * @param origin The origin of generation
 * @param customPeriod The custom period to use (by default will use the task period)
 * @param writeActivity If we should write activity
 * @param debug If we should print debug info on the report
 * @param meta Additional meta to pass to result
 * @param events The event emitter to track generation events
 *
 * @returns The result
 */
export default async function generateReport(
  task: Omit<TaskType, 'template'>,
  origin: string,
  customPeriod?: ReportPeriodType,
  writeActivity = true,
  debug = false,
  meta = {},
  events: EventEmitter = new EventEmitter(),
) {
  // Prepare report
  const startTime = new Date();
  const { namespace, result, paths } = await prepareReport(task, startTime, writeActivity, meta);
  let template: TemplateBodyType | undefined;

  logger.debug('Generation of report started');
  events.emit('start', namespace);

  try {
    // Resolve targets
    const targets = compact(task.targets);
    if (targets.length <= 0) {
      throw new Error("Targets can't be null");
    }

    // Resolve period
    const period = resolveReportPeriod(task, customPeriod);
    result.detail.period = {
      start: period.start,
      end: period.end,
    };

    // Re-calc ttl if not in any debug mode
    if (writeActivity && !debug) {
      const distance = dfns.differenceInMilliseconds(period.end, period.start);
      result.detail.destroyAt = dfns
        .add(startTime, { seconds: ttl.iterations * (distance / 1000) });
    }

    // Resolve template
    template = await resolveReportTemplate(task);
    logger.debug('Template resolved');
    events.emit('templateResolved', template);

    // Resolve auth
    result.detail.auth = namespace.fetchLogin;
    logger.debug('Auth found');
    events.emit('authFound', result.detail.auth);

    // Fetch data
    const t = template;
    await Promise.all(
      template.layouts.map(
        (layout, i) => asyncWithCommonHandlers(
          () => fetchElastic({
            auth: namespace.fetchLogin.elastic,
            recurrence: task.recurrence,
            period,

            filters: t.filters,
            dateField: t.dateField,
            index: t.index || '',

            figures: layout.figures,
          }),
          { layout: i },
        ),
      ),
    );
    logger.debug('Data fetched');
    events.emit('templateFetched', template);

    // Render report
    const renderResult = await renderPdfWithVega(
      {
        doc: {
          name: task.name,
          path: `${paths.filepath}.rep`,
          namespace,
          period,
        },
        recurrence: task.recurrence,
        layouts: template.layouts,
        grid: template.grid || { cols: 2, rows: 2 },
        debug,
      },
      events,
    );
    result.detail.files.report = `${paths.namepath}.rep.pdf`;
    logger.debug({
      reportPath: result.detail.files.report,
      msg: 'Report wrote',
    });
    events.emit('templateRendered', template);

    // Update result
    result.detail = {
      ...result.detail,
      took: dfns.differenceInMilliseconds(new Date(), startTime),
      sendingTo: targets,
      stats: omit(renderResult, 'path'),
    };

    logger.info({
      reportPath: result.detail.files.report,
      genDuration: result.detail.took,
      genDurationUnit: 'ms',
      msg: 'Report successfully generated',
    });
  } catch (error) {
    handleReportError(error, result, paths, startTime);
  }

  // Update task if needed
  if (writeActivity) {
    await writeReportActivity(task, origin, result, paths, startTime, meta);
  }

  // Write detail when process is ending
  try {
    await writeInfoFile(`${paths.filepath}.det`, result);
    result.detail.files.detail = `${paths.namepath}.det.json`;
    logger.debug({
      detailPath: result.detail.files.detail,
      msg: 'Detail wrote',
    });
  } catch (err) {
    logger.error({
      err,
      msg: 'Unable to write detail',
    });
  }

  // Write debug when process is ending
  try {
    await writeInfoFile(`${paths.filepath}.deb`, omit(template, 'renderOptions.layouts'));
    result.detail.files.debug = `${paths.namepath}.deb.json`;
    logger.debug({
      detailPath: result.detail.files.debug,
      msg: 'Debug wrote',
    });
  } catch (err) {
    logger.error({
      err,
      msg: 'Unable to write debug',
    });
  }

  return result;
}
