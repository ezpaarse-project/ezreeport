import EventEmitter from 'node:events';

import { format, add, differenceInMilliseconds } from '@ezreeport/dates';
import type { GenerationQueueDataType } from '@ezreeport/models/queues';
import type { TemplateBodyType } from '@ezreeport/models/templates';
import type {
  ReportErrorMetaType,
  ReportErrorNamesType,
  ReportErrorType,
  ReportResultType,
} from '@ezreeport/models/reports';

import { Readable } from 'node:stream';
import { appLogger } from '~/lib/logger';
import config from '~/lib/config';
import { fetchElastic } from '~/models/fetch';
import TypedError from '~/models/errors';
import { RenderEventMap, renderPdfWithVega } from '~/models/render';

import TemplateError from './errors';
import { createReportWriteStream } from '../rpc/client/files';

const { ttl } = config.report;

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
  const todayStr = format(startTime, 'yyyy-MM');

  let filename = `ezREEPORT_${data.task.name.toLowerCase().replace(/[/ .]/g, '-')}`;
  if (process.env.NODE_ENV === 'production' || data.writeActivity) {
    filename += `_${data.id}`;
  }
  const reportId = `${todayStr}/${filename}`;

  const periodDifference = differenceInMilliseconds(data.period.end, data.period.start);

  // Prepare result
  const result: ReportResultType = {
    success: true,
    detail: {
      jobId: data.id,
      taskId: data.task.id,
      createdAt: startTime,
      destroyAt: add(
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

  return {
    result,
    reportId,
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
    throw new TemplateError(
      `Resolved template's (template.v${template.body.version}: ${task.extendedId}, task.v${task.template.version}: ${task.name}) is not compatible with task`,
      'VersionMismatchError',
    );
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
 * @param err The error
 * @param result The result
 * @param logger The current logger
 * @param startTime When the generation started
 */
function handleReportError(
  err: unknown,
  result: ReportResultType,
  logger: typeof appLogger,
  startTime = new Date(),
) {
  const error: ReportErrorType = {
    type: 'UnknownError',
    name: 'UnknownError',
    message: `${err}`,
  };

  if (err instanceof Error) {
    error.message = err.message;
    error.stack = err.stack?.split('\n    ') ?? [];
    if (err instanceof TypedError) {
      error.type = err.type;
      error.name = err.name as ReportErrorNamesType;
      error.cause = err.cause as ReportErrorMetaType;
    }
  }

  // Update result
  const r = result;
  r.success = false;
  r.detail = {
    ...result.detail,
    took: differenceInMilliseconds(new Date(), startTime),
    error,
  };

  logger.error({
    reportPath: result.detail.files.report,
    duration: result.detail.took,
    durationUnit: 'ms',
    err: {
      ...error,
      cause: {
        ...error.cause,
        esQuery: undefined,
        vegaSpec: undefined,
      },
    },
    msg: 'Report failed to generate',
  });
}

/**
 * Shorthand to stringify an object
 *
 * @param obj The object
 *
 * @returns Stringified object
 */
const stringify = (obj: unknown) => JSON.stringify(
  obj,
  null,
  process.env.NODE_ENV === 'production' ? undefined : 2,
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
  const { result, reportId } = await prepareReport(data);

  /**
   * Send file to remote storage
   *
   * @param data The file content
   * @param filename The file name
   * @param taskId The id of the task
   * @param destroyAt When the file should be deleted
   *
   * @returns Promise resolving when file is sent
   */
  const writeReportFile = async (content: Buffer, filename: string) => {
    const remoteStream = await createReportWriteStream(
      filename,
      data.task.id,
      result.detail.destroyAt,
    );

    return new Promise<void>((resolve, reject) => {
      remoteStream
        .on('finish', () => resolve())
        .on('error', (err) => reject(err));

      Readable.from(content).pipe(remoteStream);
    });
  };

  logger.info({
    msg: 'Generation of report started',
    namespace: data.namespace.name,
    templateId: data.task.extendedId,
    template: data.template.name,
    taskId: data.task.id,
    task: data.task.name,
    reportId,
  });
  events.emit('start', { reportId });

  let template: TemplateBodyType | undefined;
  try {
    // Resolve template
    template = await resolveReportTemplate(data);
    logger.debug('Template resolved');
    events.emit('resolve:template', template);

    // Resolve auth
    result.detail.auth = data.namespace.fetchLogin;

    // Fetch data
    await Promise.all(
      template.layouts.map(
        async (layout, i) => {
          try {
            const res = await fetchElastic({
              auth: data.namespace.fetchLogin.elastic,
              recurrence: data.task.recurrence,
              period: data.period,

              filters: template!.filters,
              dateField: template!.dateField,
              index: template!.index || '',

              figures: layout.figures,
            });

            return res;
          } catch (err) {
            if (err instanceof Error) {
              const cause = err.cause ?? {};
              err.cause = { ...cause, layout: i };
            }
            throw err;
          }
        },
      ),
    );
    logger.debug('Data fetched');
    events.emit('fetch:template', template);

    // Render report
    const { data: pdfData, pageCount } = await renderPdfWithVega(
      {
        doc: {
          name: data.task.name,
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
    logger.debug({
      msg: 'Report generated',
      size: pdfData.byteLength,
      sizeUnit: 'B',
      pageCount,
    });
    events.emit('render:template', template);

    // Update result
    result.detail = {
      ...result.detail,
      took: differenceInMilliseconds(new Date(), startTime),
      sendingTo: data.targets,
      stats: {
        size: pdfData.byteLength,
        pageCount,
      },
    };

    await writeReportFile(pdfData, `${reportId}.rep.pdf`);
    result.detail.files.report = `${reportId}.rep.pdf`;
    logger.debug({
      reportPath: `${reportId}.rep.pdf`,
      msg: 'Report wrote',
    });

    logger.info({
      genDuration: result.detail.took,
      genDurationUnit: 'ms',
      msg: 'Report successfully generated',
    });
  } catch (error) {
    handleReportError(error, result, logger, startTime);
  }

  // Write detail when process is ending
  try {
    await writeReportFile(
      Buffer.from(stringify(result), 'utf-8'),
      `${reportId}.det.json`,
    );
    result.detail.files.detail = `${reportId}.det.json`;
    logger.debug({
      detailPath: `${reportId}.det.json`,
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
    await writeReportFile(
      Buffer.from(stringify(template), 'utf-8'),
      `${reportId}.deb.json`,
    );
    result.detail.files.debug = `${reportId}.deb.json`;
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
