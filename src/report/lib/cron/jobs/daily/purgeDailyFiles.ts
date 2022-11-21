import {
  differenceInMonths,
  endOfDay,
  formatDuration,
  intervalToDuration,
  parseISO
} from 'date-fns';
import { readFile, unlink } from 'fs/promises';
import { join } from 'node:path';
import { isValidResult } from '../../../../models/reports';
import config from '../../../config';
import glob from '../../../glob';
import logger from '../../../logger';
import { formatInterval } from '../../../utils';

const rootPath = config.get('rootPath');
const { outDir } = config.get('pdf');

const basePath = join(rootPath, outDir);

export default async () => {
  const start = new Date();
  try {
    const today = endOfDay(start);

    // A report path is smothing like <basePath>/<year>/<year>-<month>/<file>.<json|pdf>
    const detailFiles = await glob(join(basePath, '**/*.json'));
    // List all files to delete
    const filesToDelete = (await Promise.allSettled(
      detailFiles.map(async (filePath) => {
        try {
          logger.debug(`[cron] [daily-file-purge] Checking "${filePath}"`);
          const fileContent = JSON.parse(await readFile(filePath, 'utf-8'));

          if (!isValidResult(fileContent)) {
            return [];
          }

          const fileDate = parseISO(fileContent.detail.date.toString());
          if (differenceInMonths(today, fileDate) < 1) {
            return [];
          }

          const dur = intervalToDuration({ end: today, start: fileDate });
          return Object
            .values(fileContent.detail.files)
            .map((file) => ({ file: join(basePath, file), dur }));
        } catch (error) {
          logger.error(`[cron] [daily-file-purge] Error on file "${detailFiles}" : ${(error as Error).message}`);
          throw error;
        }
      }),
    )).flatMap((v) => (v.status === 'fulfilled' ? v.value : { file: '', dur: { } }));

    // Actually delete files
    const deletedFiles = (await Promise.allSettled(
      filesToDelete.map(async ({ file, dur }) => {
        try {
          if (!file) {
            return '';
          }

          await unlink(file);

          logger.info(`[cron] [daily-file-purge] Deleted "${file}" (${formatDuration(dur, { format: ['years', 'months', 'days'] })} old)`);
          return file;
        } catch (error) {
          logger.error(`[cron] [daily-file-purge] Error on file deletion "${detailFiles}" : ${(error as Error).message}`);
          throw error;
        }
      }),
    )).filter((v) => v.status === 'fulfilled' && v.value);

    const dur = formatInterval({ start, end: new Date() });
    logger.info(`[cron] [daily-file-purge] In ${dur}s : Checked ${detailFiles.length} reports | Deleted ${deletedFiles.length}/${filesToDelete.length} files`);
  } catch (error) {
    const dur = formatInterval({ start, end: new Date() });
    logger.error(`[cron] [daily-file-purge] Job failed in ${dur}s with error: ${(error as Error).message}`);
    throw error;
  }
};
