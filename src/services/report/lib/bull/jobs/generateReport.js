// @ts-check

const EventEmitter = require('node:events');
const { readFile } = require('node:fs/promises');
const { join } = require('node:path');

const config = require('../../config').default;
const { formatISO } = require('../../date-fns');
const { appLogger: logger } = require('../../logger');

const { generateReport } = require('../../../models/reports');

/**
 * @typedef {import('bullmq').Job<import('..').GenerationData>} Job
 * @typedef {import('../../../models/templates').TemplateType} TemplateType
 * @typedef {import('../../../models/reports').ReportResultType} ReportResultType
 * @typedef {import('..').MailResult} MailResult
 */

const { outDir } = config.report;

/**
 * @param {Job} job
 * @returns {Promise<{ res: ReportResultType; mailData: Partial<MailResult>; }>}
 */
module.exports = async (job) => {
  logger.verbose(`[bull] [${process.pid}] Received generation of "${job.data.task.name}"`);
  const {
    id: jobId,
    data: {
      task,
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
      namespace: task.namespaceId,
    },
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
