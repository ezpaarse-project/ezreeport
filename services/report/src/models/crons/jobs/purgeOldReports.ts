import { readFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';

import type { Job } from 'bullmq';
import type { Logger } from 'pino';
import { enUS } from 'date-fns/locale';
import { glob } from 'glob';

import * as dfns from '~/lib/date-fns';
import config from '~/lib/config';

import { ReportResult } from '~/models/reports/types';
import { CronDataType } from '~/models/crons/types';

const { outDir } = config.report;

type FileCheckResult = {
  file: string;
  dur: dfns.Duration;
};

export default async function purgeOldReports(job: Job<CronDataType>, logger: Logger) {
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
        async (filePath: string): Promise<FileCheckResult[]> => {
          try {
            logger.debug({
              file: filePath,
              msg: 'Checking file',
            });

            const fileContent = await ReportResult.parseAsync(
              JSON.parse(await readFile(filePath, 'utf-8')),
            );

            if (dfns.isBefore(today, fileContent.detail.destroyAt)) {
              return [];
            }

            const dur = dfns.intervalToDuration({
              start: fileContent.detail.createdAt,
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
    )).filter((v) => v.status === 'fulfilled').flatMap(({ value }) => value);

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
    )).filter((v) => v.status === 'fulfilled');

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
    throw err;
  }
}
