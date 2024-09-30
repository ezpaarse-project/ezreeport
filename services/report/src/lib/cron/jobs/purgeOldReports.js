// @ts-check

const { readFile, unlink } = require('node:fs/promises');
const { join } = require('node:path');

const { enUS } = require('date-fns/locale');
const { glob } = require('glob');

const config = require('../../config').default;
const dfns = require('../../date-fns');
const { isFulfilled } = require('../../utils');
const { Value } = require('../../typebox');

const { ReportResult } = require('../../../models/reports');

const { sendError } = require('./utils');

const { outDir } = config.report;

/**
 * @typedef {import('bullmq').Job<import('..').CronData>} Job
 * @typedef {import('date-fns').Duration} Duration
 *
 * @typedef {{ file: string, dur: Duration }} FileCheckResult
 */

/**
 * @param {Job} job
 * @param {import('pino').Logger} logger
 */
module.exports = async (job, logger) => {
  const start = Date.now();
  logger.debug('Started');

  try {
    const today = dfns.endOfDay(start);

    const detailFiles = await glob(join(outDir, '**/*.det.json'));
    // List all files to delete
    const filesToDelete = (await Promise.allSettled(
      detailFiles.map(
        /**
         * @param {string} filePath
         * @returns {Promise<FileCheckResult[]>}
         */
        async (filePath) => {
          try {
            logger.debug({
              file: filePath,
              msg: 'Checking file',
            });
            const fileContent = Value.Cast(
              ReportResult,
              JSON.parse(await readFile(filePath, 'utf-8')),
            );

            const destroyAt = dfns.parseISO(fileContent.detail.destroyAt);
            if (dfns.isBefore(today, destroyAt)) {
              return [];
            }

            const dur = dfns.intervalToDuration({
              start: dfns.parseISO(fileContent.detail.createdAt),
              end: today,
            });
            return Object
              .values(fileContent.detail.files)
              .map((file) => ({ file: join(outDir, file), dur }));
          } catch (err) {
            logger.warn({
              file: filePath,
              msg: 'Error on file',
              err,
            });
            throw err;
          }
        },
      ),
    )).filter(isFulfilled).flatMap(({ value }) => value);

    // Actually delete files
    const deletedFiles = (await Promise.allSettled(
      filesToDelete.map(async ({ file, dur }, i) => {
        try {
          if (!file) {
            return '';
          }

          await unlink(file);
          await job.updateProgress(i / filesToDelete.length);

          logger.info({
            file,
            age: dur,
            ageAsString: dfns.formatDuration(dur, { format: ['years', 'months', 'days'], locale: enUS }),
            msg: 'Deleted file',
          });
          return file;
        } catch (err) {
          logger.warn({
            file,
            err,
            msg: 'Error on file deletion',
          });
          throw err;
        }
      }),
    )).filter(isFulfilled);

    const end = Date.now();
    logger.info({
      cronDuration: end - start,
      cronDurationUnit: 'ms',
      checkedFiles: detailFiles.length,
      deletedFiles: deletedFiles.length,
      toDeleteFiles: filesToDelete.length,
      msg: 'Purged old reports',
    });
  } catch (err) {
    const end = Date.now();
    logger.error({
      cronDuration: end - start,
      cronDurationUnit: 'ms',
      err,
      msg: 'Failed to purge old reports',
    });
    await sendError(err, job.name, logger);
  }
};
