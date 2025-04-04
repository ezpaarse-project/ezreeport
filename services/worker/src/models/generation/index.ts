import EventEmitter from 'node:events';
import { join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

import { omit } from 'lodash';

import * as dfns from '@ezreeport/dates';
import { asyncWithCommonHandlers } from '@ezreeport/models/lib/utils';
import { ReportErrorCause, type ReportResultType } from '@ezreeport/models/reports';
import type { GenerationQueueDataType } from '@ezreeport/models/queues';
import type { TemplateBodyType } from '@ezreeport/models/templates';

import { appLogger } from '~/lib/logger';
import config from '~/lib/config';
import { fetchElastic } from '~/models/fetch';
import { RenderEventMap, renderPdfWithVega } from '~/models/render';

const { ttl, outDir } = config.report;

/**
 * Prepare report by ensuring paths, namespace and prepare result
 *
 * @param data The generation data
 * @param startTime When the generation started
 *
 * @returns The paths and the initial result
 */
async function prepareReport(data: GenerationQueueDataType, startTime = new Date()) {
  // Prepare file paths
  const todayStr = dfns.format(startTime, 'yyyy/yyyy-MM');
  const basePath = join(outDir, todayStr, '/');

  let filename = `ezREEPORT_${data.task.name.toLowerCase().replace(/[/ .]/g, '-')}`;
  if (process.env.NODE_ENV === 'production' || data.writeActivity) {
    filename += `_${data.id}`;
  }
  const filepath = join(basePath, filename);
  const reportId = `${todayStr}/${filename}`;

  const periodDifference = dfns.differenceInMilliseconds(data.period.end, data.period.start);

  // Prepare result
  const result: ReportResultType = {
    success: true,
    detail: {
      jobId: data.id,
      taskId: data.task.id,
      createdAt: startTime,
      destroyAt: dfns.add(
        startTime,
        { days: ttl.days, seconds: ttl.iterations * (periodDifference / 1000) },
      ),
      period: {
        start: data.period.start,
        end: data.period.end,
      },
      took: 0,
      files: { detail: `${reportId}.det.json` },
      meta: typeof data.writeActivity === 'object' ? data.writeActivity : {},
    },
  };

  await mkdir(basePath, { recursive: true });

  return {
    result,
    paths: {
      filepath,
      reportId,
    },
  };
}

/**
 * Resolve whole report template
 *
 * @param data The generation data
 *
 * @returns Resolved template
 */
async function resolveReportTemplate(data: GenerationQueueDataType) {
  const { template, task } = data;
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
 * @param logger The current logger
 * @param startTime When the generation started
 */
function handleReportError(
  error: unknown,
  result: ReportResultType,
  logger: typeof appLogger,
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
    duration: result.detail.took,
    durationUnit: 'ms',
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

export interface GenerationEventMap extends RenderEventMap {
  start: [{ reportId: string }];
  'resolve:template': [TemplateBodyType];
  'fetch:template': [TemplateBodyType];
  'render:template': [TemplateBodyType];
  end: [ReportResultType]
}

/**
 * Generate report
 *
 * @param data The report data
 * @param events Event handler
 *
 * @fires #start When generation starts
 * @fires #resolve:template When template is resolved
 * @fires #fetch:template When data is fetched
 * @fires #render:slots When base slots are generated.
 * @fires #render:figure When figure is added in a slot.
 * @fires #render:layout When a layout is rendered.
 * @fires #render:template When template is rendered
 * @fires #end When generation ends
 *
 * @returns The result
 */
export async function generateReport(
  data: GenerationQueueDataType,
  events = new EventEmitter<GenerationEventMap>(),
) {
  const logger = appLogger.child({
    scope: 'generateReport',
    jobId: data.id,
  });

  // Prepare report
  const startTime = new Date();
  const { result, paths } = await prepareReport(data);

  logger.info({
    msg: 'Generation of report started',
    namespace: data.namespace.name,
    templateId: data.task.extendedId,
    template: data.template.name,
    taskId: data.task.id,
    task: data.task.name,
    paths,
  });
  events.emit('start', { reportId: paths.reportId });

  let template: TemplateBodyType | undefined;
  try {
    // Resolve template
    template = await resolveReportTemplate(data);
    logger.debug('Template resolved');
    events.emit('resolve:template', template);

    // Resolve auth
    result.detail.auth = data.namespace.fetchLogin;

    // Fetch data
    const t = template;
    await Promise.all(
      template.layouts.map(
        (layout, i) => asyncWithCommonHandlers(
          () => fetchElastic({
            auth: data.namespace.fetchLogin.elastic,
            recurrence: data.task.recurrence,
            period: data.period,

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
    events.emit('fetch:template', template);

    // Render report
    const renderResult = await renderPdfWithVega(
      {
        doc: {
          name: data.task.name,
          path: `${paths.filepath}.rep`,
          namespace: data.namespace,
          period: data.period,
        },
        recurrence: data.task.recurrence,
        layouts: template.layouts,
        grid: template.grid || { cols: 2, rows: 2 },
        debug: data.printDebug ?? false,
      },
      events,
    );
    result.detail.files.report = `${paths.reportId}.rep.pdf`;
    logger.debug({
      reportPath: result.detail.files.report,
      msg: 'Report wrote',
    });
    events.emit('render:template', template);

    // Update result
    result.detail = {
      ...result.detail,
      took: dfns.differenceInMilliseconds(new Date(), startTime),
      sendingTo: data.targets,
      stats: omit(renderResult, 'path'),
    };

    logger.info({
      reportPath: result.detail.files.report,
      genDuration: result.detail.took,
      genDurationUnit: 'ms',
      msg: 'Report successfully generated',
    });
  } catch (error) {
    handleReportError(error, result, logger, startTime);
  }

  // Write detail when process is ending
  try {
    await writeInfoFile(`${paths.filepath}.det`, result);
    result.detail.files.detail = `${paths.reportId}.det.json`;
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
    result.detail.files.debug = `${paths.reportId}.deb.json`;
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

  events.emit('end', result);
  return result;
}
