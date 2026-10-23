import { endOfDay } from '@ezreeport/dates';

import knex from '~/lib/knex';

import type { Executor } from '~/models/crons/types';
import type { DBReportEntry } from '~/models/reports/types';
import { deleteReport } from '~/models/reports';

const purgeOldReports: Executor = async (logger) => {
  const today = endOfDay(Date.now());

  const filesToDelete = await knex
    .table<DBReportEntry>('reports')
    .select('filename')
    .where('destroy_at', '<=', today);

  const deletedFiles = await Promise.all(
    filesToDelete.map(async ({ filename }) => {
      try {
        await deleteReport(filename);
        return true;
      } catch (error) {
        logger.error({ error, filename, msg: 'Error on file deletion' });
        return false;
      }
    })
  );

  return {
    deletedFiles: deletedFiles.filter((deleted) => Boolean(deleted)).length,
    msg: 'Purged old reports',
    toDeleteFiles: filesToDelete.length,
  };
};

// oxlint-disable-next-line import/no-default-export
export default purgeOldReports;
