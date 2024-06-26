// @ts-check

const { Queue, Job } = require('bullmq');
const { format, parseISO } = require('date-fns');

const config = require('../../config').default;
const { appLogger: logger } = require('../../logger');
const { generateMail, sendMail } = require('../../mail');
const { b64ToString, isFulfilled, stringToB64 } = require('../../utils');

const { recurrenceToStr } = require('../../../models/recurrence');

const {
  redis,
  mail: { team },
  api: { url: APIurl },
} = config;

/**
 * @typedef {import('../../mail').MailOptions} MailOptions
 * @typedef {import('..').MailResult} MailResult
 */

/**
 * @typedef {Object} ErrorReportPrams
 * @property {MailResult} data
 * @property {Omit<MailOptions, 'to' | 'body' | 'subject'>} options
 * @property {Object} bodyData
 * @property {string} bodyData.recurrence
 * @property {string} bodyData.namespace
 * @property {string} bodyData.name
 * @property {string} bodyData.date
 * @property {string} filename
 * @property {Date} date
 * @property {string} dateStr
 */

/**
 * @param {ErrorReportPrams} param0
 */
const sendErrorReport = async ({
  data,
  options,
  bodyData,
  filename,
  date,
  dateStr,
}) => {
  // TODO[feat]: Ignore team if test report ?
  const to = [...new Set([data.contact ?? '', team])];

  /** @type {string} */
  let error;
  try {
    const { detail } = JSON.parse(b64ToString(data.file));
    error = detail.error.message;
  } catch (err) {
    error = 'Unknown error, see attachements';
  }

  await sendMail({
    ...options,
    to,
    subject: `Erreur de Reporting ezMESURE [${dateStr}] - ${data.task.name}`,
    body: await generateMail('error', { ...bodyData, error, date: format(date, 'dd/MM/yyyy à HH:mm:ss') }),
  });
  logger.info(`[mail] [${process.pid}] Error report [${filename}] sent to [${to.filter((v) => v).join(', ')}]`);
};

/**
 * @typedef {Object} SuccessReportParams
 * @property {string} filename
 * @property {string} dateStr
 * @property {Omit<MailOptions, 'to' | 'body' | 'subject'>} options
 * @property {Object} bodyData
 * @property {string} bodyData.recurrence
 * @property {string} bodyData.namespace
 * @property {string} bodyData.name
 * @property {string} bodyData.date
 * @property {MailResult['task']} task
 */

/**
 * @param {SuccessReportParams} param0
 */
const sendSuccessReport = async ({
  task,
  options,
  dateStr,
  bodyData,
  filename,
}) => {
  // Send one email per target to allow un-subscription prefill
  const targets = await Promise.allSettled(
    task.targets.map(async (to) => {
      try {
        const taskId64 = stringToB64(task.id);
        const to64 = stringToB64(to);
        const unsubId = encodeURIComponent(`${taskId64}:${to64}`);

        const unsubscribeLink = `${APIurl}/unsubscribe/${unsubId}`;
        await sendMail({
          ...options,
          to,
          subject: `Reporting ezMESURE [${dateStr}] - ${task.name}`,
          body: await generateMail('success', { ...bodyData, unsubscribeLink }),
        });

        return to;
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`[mail] [${process.pid}] Report [${filename}] wan't sent to [${to}] with error: {${error.message}}`);
        } else {
          logger.error(`[cron] [${process.pid}] Unexpected error when sending report [${filename}] wan't sent to [${to}]: {${error}}`);
        }
        throw error;
      }
    }),
  );

  const successTargets = targets.filter(isFulfilled).map(({ value }) => value);
  if (successTargets.length > 0) {
    logger.info(`[mail] [${process.pid}] Report [${filename}] sent to [${successTargets.join(', ')}]`);
  } else {
    logger.error(`[mail] [${process.pid}] Report [${filename}] wasn't sent to anyone (see previous logs)`);
  }
};

/**
 * @param {MailResult} data
 * @param {Date} date
 * @param {string} dateStr
 * @returns {Promise<void>}
 */
const sendReport = (data, date, dateStr) => {
  const filename = data.url.replace(/^.*\//, '');

  /** @type {Omit<MailOptions, 'to' | 'body' | 'subject'>} */
  const options = {
    attachments: [{
      filename,
      content: data.file,
      encoding: 'base64',
    }],
  };
  const bodyData = {
    recurrence: recurrenceToStr(data.task.recurrence),
    name: data.task.name,
    namespace: data.namespace,
    date: dateStr,
  };

  if (data.success) {
    return sendSuccessReport({
      filename,
      dateStr,
      options,
      bodyData,
      task: data.task,
    });
  }
  return sendErrorReport({
    data,
    bodyData,
    date,
    dateStr,
    filename,
    options,
  });
};

/**
 * @typedef {Object} ErrorParams
 * @property {string} file
 * @property {string} filename
 * @property {string} contact
 * @property {string} date
 */

/**
 * @param {ErrorParams} data
 * @param {Date} date
 * @param {string} dateStr
 */
const sendError = async (data, date, dateStr) => {
  await sendMail({
    attachments: [{
      filename: data.filename,
      content: data.file,
      encoding: 'base64',
    }],
    to: [team],
    subject: `Erreur de Reporting ezMESURE [${dateStr}]`,
    body: await generateMail('error', {
      error: 'Unknown error, see attachements',
      date: format(date, 'dd/MM/yyyy à HH:mm:ss'),
    }),
  });
  logger.info(`[mail] [${process.pid}] Error sent to [${team}]`);
};

/**
 * @param {Job} j
 * @returns {Promise<void>}
 */
module.exports = async (j) => {
  // Re-getting job from it's id and queue to get child jobs
  // See https://github.com/taskforcesh/bullmq/issues/753
  /** @type {Queue<MailResult>} */
  const queue = new Queue(j.queueName, { connection: redis });
  const job = await Job.fromId(queue, j.id ?? '');
  if (!job) {
    throw new Error(`Cannot find job [${j.id}] in queue [${queue.name}]`);
  }

  /** @type {MailResult} */
  const data = Object.values(await job.getChildrenValues())[0]?.mailData;

  const date = parseISO(data.date);
  const dateStr = format(date, 'dd/MM/yyyy');

  try {
    if (data && !job.data.error) {
      await sendReport(data, date, dateStr);
      return;
    }

    if (job.data.error) {
      await sendError(job.data, date, dateStr);
      return;
    }

    throw new Error('No suitable data found');
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`[mail] [${process.pid}] Error when sending incoming report: {${error.message}}`);
    } else {
      logger.error(`[cron] [${process.pid}] Unexpected error when sending incoming report: {${error}}`);
    }
  }
};
