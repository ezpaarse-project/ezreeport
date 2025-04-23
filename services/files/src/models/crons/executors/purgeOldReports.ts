import { endOfDay } from '@ezreeport/dates';

import knex from '~/lib/knex';

import type { Executor } from '~/models/crons/types';
import { deleteReport } from '~/models/reports';
import type { DBReportEntry } from '~/models/reports/types';

const purgeOldReports: Executor = async (logger) => {
  const today = endOfDay(Date.now());

  const filesToDelete = await knex.table<DBReportEntry>('reports')
    .select('filename')
    .where('destroy_at', '<=', today);

  const deletedFiles = await Promise.all(
    filesToDelete.map(async ({ filename }) => {
      try {
        await deleteReport(filename);
        return true;
      } catch (err) {
        logger.error({ msg: 'Error on file deletion', filename, err });
        return false;
      }
    }),
  );

  return {
    msg: 'Purged old reports',
    toDeleteFiles: filesToDelete.length,
    deletedFiles: deletedFiles.filter((deleted) => deleted).length,
  };
};

export default purgeOldReports;
