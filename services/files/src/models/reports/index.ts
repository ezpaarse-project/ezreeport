import type { Readable, Writable } from 'node:stream';
import { dirname, resolve } from 'node:path';
import { createWriteStream, createReadStream, existsSync } from 'node:fs';
import { unlink, mkdir } from 'node:fs/promises';

import config from '~/lib/config';
import { appLogger } from '~/lib/logger';
import knex from '~/lib/knex';

import type { DBReportEntry } from './types';

const logger = appLogger.child({ scope: 'reports' });

const { paths: { reports: reportsDir } } = config;

export async function createWriteReportStream(
  filename: string,
  destroyAt: string,
): Promise<Writable> {
  const path = resolve(reportsDir, filename);
  await mkdir(dirname(path), { recursive: true });

  const entry = { created_at: new Date(), destroy_at: new Date(destroyAt) };
  await knex<DBReportEntry>('reports')
    .insert({ filename, ...entry })
    .onConflict('filename')
    .merge({ ...entry });

  logger.info({ msg: 'File metadata added', filename, entry });

  return createWriteStream(path)
    .on('finish', () => { logger.info({ msg: 'File written', filename }); })
    .on('error', async (writeError) => {
      logger.error({ msg: 'Error on file write', filename, err: writeError });
      try {
        await unlink(path);
      } catch (err) {
        logger.error({ msg: 'Error on file deletion', filename, err });
      }
    });
}

export function createReadReportStream(filename: string): Readable {
  const path = resolve(config.paths.reports, filename);
  if (!existsSync(path)) {
    throw new Error(`File ${path} not found`);
  }

  return createReadStream(path)
    .on('finish', () => { logger.info({ msg: 'File read', filename }); })
    .on('error', (err) => { logger.error({ msg: 'Error on file read', filename, err }); });
}

export async function deleteReport(filename: string): Promise<void> {
  const path = resolve(config.paths.reports, filename);
  if (!existsSync(path)) {
    return;
  }

  await unlink(path);
}
