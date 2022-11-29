import type Queue from 'bull';
import {
  differenceInMonths,
  endOfDay,
  formatDuration,
  intervalToDuration,
  parseISO
} from 'date-fns';
import { readFile, unlink } from 'fs/promises';
import { join } from 'node:path';
import type { CronData } from '..';
import { isValidResult } from '../../../models/reports';
import config from '../../config';
import apm from '../../elastic/apm'; // Setup Elastic's APM for monitoring
import glob from '../../glob';
import logger from '../../logger';
import { formatInterval, isFulfilled } from '../../utils';
import { sendError } from './utils';

const rootPath = config.get('rootPath');
const { outDir } = config.get('pdf');

const basePath = join(rootPath, outDir);

type FileCheckResult = { file: string, dur: Duration };

export default async (job: Queue.Job<CronData>) => {
  const start = new Date();
  logger.debug(`[cron] [${job.name}] Started`);

  const apmtrans = apm.startTransaction(job.name, 'cron');
  if (!apmtrans) {
    logger.warn(`[cron] [${job.name}] Can't start APM transaction`);
  }

  try {
    const today = endOfDay(start);

    const detailFiles = await glob(join(basePath, '**/*.det.json'));
    // List all files to delete
    const filesToDelete = (await Promise.allSettled(
      detailFiles.map(async (filePath) => {
        try {
          logger.debug(`[cron] [${job.name}] Checking "${filePath}"`);
          const fileContent = JSON.parse(await readFile(filePath, 'utf-8'));

          if (!isValidResult(fileContent)) {
            return [];
          }

          // TODO[refactor]: Re-do types InputTask & Task to avoid getting Date instead of string in some cases. Remember that Prisma.TaskCreateInput exists. https://www.prisma.io/docs/concepts/components/prisma-client/advanced-type-safety
          const fileDate = parseISO(fileContent.detail.date.toString());
          if (differenceInMonths(today, fileDate) < 1) {
            return [];
          }

          const dur = intervalToDuration({ end: today, start: fileDate });
          return Object
            .values(fileContent.detail.files)
            .map((file) => ({ file: join(basePath, file), dur } as FileCheckResult));
        } catch (error) {
          logger.warn(`[cron] [${job.name}] Error on file "${filePath}" : ${(error as Error).message}`);
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

          logger.info(`[cron] [${job.name}] Deleted "${file}" (${formatDuration(dur, { format: ['years', 'months', 'days'] })} old)`);
          return file;
        } catch (error) {
          logger.warn(`[cron] [${job.name}] Error on file deletion "${file}" : ${(error as Error).message}`);
          throw error;
        }
      }),
    )).filter(isFulfilled);

    const dur = formatInterval({ start, end: new Date() });
    logger.info(`[cron] [${job.name}] In ${dur}s : Checked ${detailFiles.length} reports | Deleted ${deletedFiles.length}/${filesToDelete.length} files`);
    apmtrans?.end('success');
  } catch (error) {
    const dur = formatInterval({ start, end: new Date() });
    logger.error(`[cron] Job ${job.name} failed in ${dur}s with error: ${(error as Error).message}`);
    apmtrans?.end('error');
    await sendError(error as Error, 'index', job.data.timer);
  }
};
