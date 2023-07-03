import type Queue from 'bull';
import { enUS } from 'date-fns/locale';
import { glob } from 'glob';

import { readFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';

import config from '~/lib/config';
import {
  endOfDay,
  formatDuration,
  intervalToDuration,
  isBefore,
  parseISO
} from '~/lib/date-fns';
import { appLogger as logger } from '~/lib/logger';
import { formatInterval, isFulfilled } from '~/lib/utils';

import { isValidResult } from '~/models/reports';

import type { CronData } from '..';
import { sendError } from './utils';

const { outDir } = config.get('report');

type FileCheckResult = { file: string, dur: Duration };

export default async (job: Queue.Job<CronData>) => {
  const start = new Date();
  logger.verbose(`[cron] [${process.pid}] [${job.name}] Started`);

  try {
    const today = endOfDay(start);

    const detailFiles = await glob(join(outDir, '**/*.det.json'));
    // List all files to delete
    const filesToDelete = (await Promise.allSettled(
      detailFiles.map(async (filePath) => {
        try {
          logger.verbose(`[cron] [${process.pid}] [${job.name}] Checking "${filePath}"`);
          const fileContent = JSON.parse(await readFile(filePath, 'utf-8'));

          if (!isValidResult(fileContent)) {
            return [];
          }

          // TODO[refactor]: Re-do types InputTask & Task to avoid getting Date instead of string in some cases. Remember that Prisma.TaskCreateInput exists. https://www.prisma.io/docs/concepts/components/prisma-client/advanced-type-safety
          const destroyAt = parseISO(fileContent.detail.destroyAt.toString());
          if (isBefore(today, destroyAt)) {
            return [];
          }

          const dur = intervalToDuration({
            start: parseISO(fileContent.detail.createdAt.toString()),
            end: today,
          });
          return Object
            .values(fileContent.detail.files)
            .map((file) => ({ file: join(outDir, file), dur } as FileCheckResult));
        } catch (error) {
          logger.warn(`[cron] [${process.pid}] [${job.name}] Error on file "${filePath}" : ${(error as Error).message}`);
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

          logger.info(`[cron] [${process.pid}] [${job.name}] Deleted "${file}" (${formatDuration(dur, { format: ['years', 'months', 'days'], locale: enUS })} old)`);
          return file;
        } catch (error) {
          logger.warn(`[cron] [${process.pid}] [${job.name}] Error on file deletion "${file}" : ${(error as Error).message}`);
          throw error;
        }
      }),
    )).filter(isFulfilled);

    const dur = formatInterval({ start, end: new Date() });
    logger.info(`[cron] [${process.pid}] [${job.name}] In ${dur}s : Checked ${detailFiles.length} reports | Deleted ${deletedFiles.length}/${filesToDelete.length} files`);
  } catch (error) {
    const dur = formatInterval({ start, end: new Date() });
    logger.error(`[cron] [${process.pid}] [${job.name}] Job failed in ${dur}s with error: ${(error as Error).message}`);
    await sendError(error as Error, job.name, job.data.timer);
  }
};
