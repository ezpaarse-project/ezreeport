import { readFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';

import { enUS } from 'date-fns/locale';
import { glob } from 'glob';

import * as dfns from '~common/lib/date-fns';
import config from '~/lib/config';

import { ReportResult } from '~common/types/reports';
import type { Executor, Logger } from '~/models/crons/types';

const { reportDir } = config;

type DeletableFile = {
  file: string;
  dur: dfns.Duration;
};

async function listDeletableFilesOfDetail(
  filePath: string,
  logger: Logger,
  today: Date,
): Promise<DeletableFile[]> {
  logger.debug({
    file: filePath,
    msg: 'Checking file',
  });

  try {
    const fileContent = JSON.parse(await readFile(filePath, 'utf-8'));
    const { data: reportResult, error } = await ReportResult.safeParseAsync(fileContent);

    if (!reportResult) {
      logger.warn({
        file: filePath,
        msg: "Couldn't parse report result",
        err: error,
      });
      return Object.values(fileContent?.detail?.files ?? {})
        .map((file) => ({ file: join(reportDir, `${file}`), dur: {} }));
    }

    if (dfns.isBefore(today, reportResult.detail.destroyAt)) {
      return [];
    }

    const dur = dfns.intervalToDuration({
      start: reportResult.detail.createdAt,
      end: today,
    });

    return Object.values(reportResult.detail.files)
      .map((file) => ({ file: join(reportDir, file), dur }));
  } catch (err) {
    logger.error({
      file: filePath,
      msg: 'Error on file',
      err,
    });
    return [];
  }
}

async function deleteFile({ file, dur }: DeletableFile, logger: Logger): Promise<string> {
  if (!file) {
    return '';
  }

  try {
    await unlink(file);

    logger.info({
      msg: 'Deleted file',
      file,
      age: dur,
      ageAsString: dfns.formatDuration(dur, { format: ['years', 'months', 'days'], locale: enUS }),
    });
    return file;
  } catch (err) {
    logger.warn({
      msg: 'Error on file deletion',
      file,
      err,
    });
    return '';
  }
}

const purgeOldReports: Executor = async (logger) => {
  const today = dfns.endOfDay(Date.now());
  const detailFiles = await glob(join(reportDir, '**/*.det.json'));

  // List all files to delete
  const filesToDelete = (await Promise.all(
    detailFiles.map((filePath) => listDeletableFilesOfDetail(filePath, logger, today)),
  )).flat();

  // Delete files
  const deletedFiles = await Promise.all(
    filesToDelete.map((file) => deleteFile(file, logger)),
  );

  return {
    msg: 'Purged old reports',
    checkedFiles: detailFiles.length,
    toDeleteFiles: filesToDelete.length,
    deletedFiles: deletedFiles.length,
  };
};

export default purgeOldReports;
