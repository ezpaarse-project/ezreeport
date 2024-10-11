// @ts-check

const EventEmitter = require('node:events');
const { readFile } = require('node:fs/promises');
const { join } = require('node:path');

const config = require('../../config').default;
const { formatISO } = require('../../date-fns');
const { appLogger } = require('../../logger');

const { default: generateReport } = require('../../../models/reports');

/**
 * @typedef {import('bullmq').Job<import('..').GenerationData>} Job
 * @typedef {import('../../../models/templates').TemplateType} TemplateType
 * @typedef {import('../../../models/reports/types').ReportResultType} ReportResultType
 * @typedef {import('..').MailResult} MailResult
 */

const { outDir } = config.report;

/**
 * @param {Job} job
 * @returns {Promise<{ res: ReportResultType; mailData: Partial<MailResult>; }>}
 */
module.exports = async (job) => {
  const logger = appLogger.child({
    scope: 'bull',
    job: job.id,
    pid: process.pid,
    taskName: job.data.task.name,
  });

  logger.debug('Received generation');
  const {
    id: jobId,
    data: {
      task,
      namespace,
      origin,
      writeActivity,
      debug,
      customPeriod,
    },
    timestamp,
  } = job;

  let expectedPageCount = 0;
  let actualPageCount = 0;
  /** * @type {string | undefined} */
  let contact;

  /**
   * @param {TemplateType} template The resolved template
   */
  const onTemplateResolved = (template) => {
    expectedPageCount = template.layouts.length;
  };

  const onLayoutRendered = async () => {
    actualPageCount += 1;

    await job.updateProgress(actualPageCount / expectedPageCount);
  };

  /**
   * @param {{ username: string, email: string, metadata: Record<string, unknown> }} c Contact found
   */
  const onContactFound = (c) => {
    contact = c.email;
  };

  const events = new EventEmitter()
    .on('templateResolved', onTemplateResolved)
    .on('layoutRendered', onLayoutRendered)
    .on('contactFound', onContactFound);

  const res = await generateReport(
    task,
    origin,
    customPeriod,
    writeActivity,
    debug,
    {
      jobId,
      jobAdded: new Date(timestamp),
    },
    events,
  );

  /** @type {Partial<MailResult>} */
  let mailData = {
    contact,
    date: res.detail.createdAt || formatISO(new Date()),
    task: {
      id: task.id,
      recurrence: task.recurrence,
      name: task.name,
      targets: task.targets,
    },
    namespace: namespace.name,
  };

  if (res.success && res.detail.files.report) {
    const file = await readFile(join(outDir, res.detail.files.report), 'base64');

    mailData = {
      ...mailData,
      success: true,
      file,
      url: `/reports/${res.detail.files.report}`,
    };
  } else {
    const file = await readFile(join(outDir, res.detail.files.detail), 'base64');
    mailData = {
      ...mailData,
      success: false,
      file,
      url: `/reports/${res.detail.files.detail}`,
    };
  }

  return { res, mailData };
};
