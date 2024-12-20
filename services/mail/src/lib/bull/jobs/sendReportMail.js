// @ts-check

const { format, parseISO } = require('date-fns');

const config = require('../../config').default;
const { appLogger } = require('../../logger');
const { generateMail, sendMail } = require('../../mail');
const { b64ToString, isFulfilled, stringToB64 } = require('../../utils');

const { recurrenceToStr } = require('../../../models/recurrence');

const {
  mail: { team },
  api: { url: APIurl },
} = config;

/**
 * @typedef {import('../../mail').MailOptions} MailOptions
 * @typedef {import('..').MailReport} MailReport
 * @typedef {import('..').MailError} MailError
 * @typedef {import('bullmq').Job<MailReport | MailError>} Job
 */

/**
 * @typedef {Object} ErrorReportPrams
 * @property {MailReport} data
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
 * @param {import('pino').Logger} logger
 */
const sendErrorReport = async ({
  data,
  options,
  bodyData,
  filename,
  date,
  dateStr,
}, logger) => {
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
  logger.info({
    filename,
    to: to.filter((v) => v),
    msg: 'Error report sent to targets',
  });
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
 * @property {MailReport['task']} task
 */

/**
 * @param {SuccessReportParams} param0
 * @param {import('pino').Logger} logger
 */
const sendSuccessReport = async ({
  task,
  options,
  dateStr,
  bodyData,
  filename,
}, logger) => {
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
      } catch (err) {
        logger.error({
          filename,
          to,
          err,
          msg: 'Error when sending report',
        });
        throw err;
      }
    }),
  );

  const successTargets = targets.filter(isFulfilled).map(({ value }) => value);
  if (successTargets.length > 0) {
    logger.info({
      filename,
      targets: successTargets,
      msg: 'Report sent to targets',
    });
  } else {
    logger.warn({
      filename,
      msg: 'No target to send report',
    });
  }
};

/**
 * @param {MailReport} data
 * @param {Date} date
 * @param {string} dateStr
 * @param {import('pino').Logger} logger
 * @returns {Promise<void>}
 */
const sendReport = (data, date, dateStr, logger) => {
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
    namespace: data.namespace.name,
    date: dateStr,
  };

  if (data.success) {
    return sendSuccessReport({
      filename,
      dateStr,
      options,
      bodyData,
      task: data.task,
    }, logger);
  }
  return sendErrorReport({
    data,
    bodyData,
    date,
    dateStr,
    filename,
    options,
  }, logger);
};

/**
 * @typedef {Object} ErrorParams
 * @property {string} file
 * @property {string} filename
 * @property {string} contact
 * @property {string} date
 */

/**
 * @param {MailError} data
 * @param {Date} date
 * @param {string} dateStr
 * @param {import('pino').Logger} logger
 */
const sendError = async ({ error }, date, dateStr, logger) => {
  await sendMail({
    attachments: [{
      filename: error.filename,
      content: error.file,
      encoding: 'base64',
    }],
    to: [team],
    subject: `Erreur de Reporting ezMESURE [${dateStr}]`,
    body: await generateMail('error', {
      error: 'Unknown error, see attachements',
      date: format(date, 'dd/MM/yyyy à HH:mm:ss'),
    }),
  });
  logger.info({
    team,
    msg: 'Error report sent to team',
  });
};

/**
 * @param {Job} job
 * @returns {Promise<void>}
 */
module.exports = async (job) => {
  const logger = appLogger.child({ scope: 'bull', job: job.id });

  const date = parseISO(job.data.date);
  const dateStr = format(date, 'dd/MM/yyyy');

  try {
    if ('error' in job.data) {
      await sendError(job.data, date, dateStr, logger);
      job.updateProgress(1);
      return;
    }

    await sendReport(job.data, date, dateStr, logger);
    job.updateProgress(1);
  } catch (err) {
    logger.error({
      err,
      msg: 'Error when sending report',
    });
  }
};
