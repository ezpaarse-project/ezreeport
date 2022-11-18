import {
  differenceInMonths,
  endOfDay,
  formatDuration,
  intervalToDuration,
  parseISO
} from 'date-fns';
import { readdir, readFile, unlink } from 'fs/promises';
import { join } from 'node:path';
import { isValidResult } from '../../../../models/reports';
import config from '../../../config';
import logger from '../../../logger';

const rootPath = config.get('rootPath');
const { outDir } = config.get('pdf');

const basePath = join(rootPath, outDir, '/');

export default async () => {
  const start = new Date();
  try {
    const today = endOfDay(start);
    const years = await readdir(basePath);

    const result = { checked: 0, deleted: 0 };
    // A report path is smothing like <basePath>/<year>/<year>-<month>/<file>.<json|pdf>
    // For each year
    await Promise.allSettled(
      years.map(async (year) => {
        try {
          const yearPath = join(basePath, year);
          const months = await readdir(yearPath);

          // For each month
          return await Promise.allSettled(
            months.map(async (month) => {
              try {
                const monthPath = join(yearPath, month);
                const files = (await readdir(monthPath)).filter((f) => /\.json$/i.test(f));

                // For each report detail
                return await Promise.allSettled(
                  files.map(async (file) => {
                    try {
                      const filePath = join(monthPath, file);
                      const strFilePath = join(outDir, year, month, file);
                      result.checked += 1;
                      logger.debug(`[cron] [daily-file-purge] Checking "${strFilePath}"`);
                      const fileContent = JSON.parse(await readFile(filePath, 'utf-8'));

                      if (isValidResult(fileContent)) {
                        const fileDate = parseISO(fileContent.detail.date.toString());
                        if (differenceInMonths(today, fileDate) >= 1) {
                          const dur = intervalToDuration({ end: today, start: fileDate });
                          // For each file
                          return await Promise.allSettled(
                            Object.values(fileContent.detail.files)
                              .map(async (reportFilePath) => {
                                try {
                                  await unlink(join(basePath, reportFilePath));
                                  result.deleted += 1;
                                  logger.info(`[cron] [daily-file-purge] Deleting "${reportFilePath}" (${formatDuration(dur, { format: ['years', 'months', 'days'] })} old)`);
                                } catch (error) {
                                  logger.error(`[cron] [daily-file-purge] Error on file: ${(error as Error).message}`);
                                  throw error;
                                }
                              }),
                          );
                        }
                      }
                      return await Promise.resolve([]);
                    } catch (error) {
                      logger.error(`[cron] [daily-file-purge] Error on report: ${(error as Error).message}`);
                      throw error;
                    }
                  }),
                );
              } catch (error) {
                logger.error(`[cron] [daily-file-purge] Error on month: ${(error as Error).message}`);
                throw error;
              }
            }),
          );
        } catch (error) {
          logger.error(`[cron] [daily-file-purge] Error on year: ${(error as Error).message}`);
          throw error;
        }
      }),
    );
    logger.info(`[cron] [daily-file-purge] Checked ${result.checked} files, deleted ${result.deleted} files`);
  } catch (error) {
    logger.error(`[cron] [daily-file-purge] Error: ${(error as Error).message}`);
    throw error;
  }
};
