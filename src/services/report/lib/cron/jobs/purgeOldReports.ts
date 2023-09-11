import { readFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import type Queue from 'bull';
import { enUS } from 'date-fns/locale';
import { glob } from 'glob';

import config from '~/lib/config';
import * as dfns from '~/lib/date-fns';
import { appLogger as logger } from '~/lib/logger';
import { formatInterval, isFulfilled } from '~/lib/utils';
import { Value } from '~/lib/typebox';

import { ReportResult } from '~/models/reports';

import type { CronData } from '..';
import { sendError } from './utils';

const { outDir } = config.report;

type FileCheckResult = { file: string, dur: Duration };

export default async (job: Queue.Job<CronData>) => {
  const start = new Date();
  logger.verbose(`[cron] [${process.pid}] [${job.name}] Started`);

  try {
    const today = dfns.endOfDay(start);

    const detailFiles = await glob(join(outDir, '**/*.det.json'));
    // List all files to delete
    const filesToDelete = (await Promise.allSettled(
      detailFiles.map(async (filePath): Promise<FileCheckResult[]> => {
        try {
          logger.verbose(`[cron] [${process.pid}] [${job.name}] Checking [${filePath}]`);
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
        } catch (error) {
          if (error instanceof Error) {
            logger.warn(`[cron] [${process.pid}] [${job.name}] Error on file [${filePath}]: {${error.message}}`);
          } else {
            logger.warn(`[cron] [${process.pid}] [${job.name}] Unexpected error occurred on file [${filePath}]: {${error}}`);
          }
          throw error;
        }
      }),
    )).filter(isFulfilled).flatMap(({ value }) => value);

    // Actually delete files
    const deletedFiles = (await Promise.allSettled(
      filesToDelete.map(async ({ file, dur }, i) => {
        try {
          if (!file) {
            return '';
          }

          await unlink(file);
          await job.progress(i / filesToDelete.length);

          logger.info(`[cron] [${process.pid}] [${job.name}] Deleted [${file}] (${dfns.formatDuration(dur, { format: ['years', 'months', 'days'], locale: enUS })} old)`);
          return file;
        } catch (error) {
          if (error instanceof Error) {
            logger.warn(`[cron] [${process.pid}] [${job.name}] Error on file deletion [${file}]: {${error.message}}`);
          } else {
            logger.warn(`[cron] [${process.pid}] [${job.name}] Unexpected error occurred on file deletion [${file}]: {${error}}`);
          }
          throw error;
        }
      }),
    )).filter(isFulfilled);

    const dur = formatInterval({ start, end: new Date() });
    logger.info(`[cron] [${process.pid}] [${job.name}] In [${dur}]s : Checked [${detailFiles.length}] reports | Deleted [${deletedFiles.length}]/[${filesToDelete.length}] files`);
  } catch (error) {
    const dur = formatInterval({ start, end: new Date() });
    if (error instanceof Error) {
      logger.error(`[cron] [${process.pid}] [${job.name}] Job failed in [${dur}]s with error: {${error.message}}`);
      await sendError(error, job.name, job.data.timer);
    } else {
      logger.warn(`[cron] [${process.pid}] [${job.name}] Unexpected error occurred after [${dur}]s: {${error}}`);
    }
  }
};
