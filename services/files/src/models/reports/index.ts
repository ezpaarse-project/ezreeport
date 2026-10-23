import type { Readable, Writable } from 'node:stream';
import { createReadStream, createWriteStream, existsSync } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import config from '~/lib/config';
import knex from '~/lib/knex';
import { appLogger } from '~/lib/logger';

import type { DBReportEntry } from './types';

const logger = appLogger.child({ scope: 'reports' });

const {
  paths: { reports: reportsDir },
} = config;

export async function createWriteReportStream(
  filename: string,
  taskId: string,
  destroyAt: string
): Promise<Writable> {
  const path = resolve(reportsDir, filename);
  await mkdir(dirname(path), { recursive: true });

  const entry = {
    created_at: new Date(),
    destroy_at: new Date(destroyAt),
    task_id: taskId,
  };
  await knex<DBReportEntry>('reports')
    .insert({ filename, ...entry })
    .onConflict('filename')
    .merge({ ...entry });

  logger.info({ entry, filename, msg: 'File metadata added' });

  return createWriteStream(path)
    .on('finish', () => {
      logger.info({ filename, msg: 'File written' });
    })
    .on('error', async (writeError) => {
      logger.error({ err: writeError, filename, msg: 'Error on file write' });
      try {
        await unlink(path);
      } catch (error) {
        logger.error({ error, filename, msg: 'Error on file deletion' });
      }
    });
}

export async function createReadReportStream(
  filename: string,
  taskId: string
): Promise<Readable> {
  const entry = await knex<DBReportEntry>('reports')
    .select('task_id')
    .where('filename', '=', filename)
    .and.where('task_id', '=', taskId)
    .first();

  if (!entry) {
    throw new Error(`File ${filename} not found for task ${taskId}`);
  }

  const path = resolve(config.paths.reports, filename);
  if (!existsSync(path)) {
    throw new Error(`File ${path} not found`);
  }

  return createReadStream(path)
    .on('finish', () => {
      logger.info({ filename, msg: 'File read' });
    })
    .on('error', (err) => {
      logger.error({ err, filename, msg: 'Error on file read' });
    });
}

export function getAllReports(): Promise<
  { filename: string; task_id: string }[]
> {
  return knex<DBReportEntry>('reports').select('filename', 'task_id');
}

export async function deleteReport(filename: string): Promise<void> {
  const path = resolve(config.paths.reports, filename);
  if (!existsSync(path)) {
    return;
  }

  await unlink(path);
}
