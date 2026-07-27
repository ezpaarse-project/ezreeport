import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import createKnex, { type Knex } from 'knex';

import config from '~/lib/config';
import { appLogger } from '~/lib/logger';

const {
  paths: { db: dbPath },
} = config;

const logger = appLogger.child({ scope: 'knex' });

async function migrateDB(knex: Knex): Promise<void> {
  try {
    const [all, toDo] = await knex.migrate.list();
    logger.debug({ all, msg: 'Found migrations', toDo });

    const [, done] = await knex.migrate.latest();
    logger.info({ done, msg: 'Database migrated' });
  } catch (error) {
    logger.error({ error, msg: 'Database migration failed' });
  }
}

function setupDB(): Knex {
  mkdirSync(dbPath, { recursive: true });

  const knex = createKnex({
    client: 'better-sqlite3',
    connection: {
      filename: resolve(dbPath, 'ezrFiles.db'),
    },
    log: {
      debug: (...args) => logger.debug(...args),
      error: (...args) => logger.error(...args),
      warn: (...args) => logger.warn(...args),
    },
    migrations: {
      // oxlint-disable-next-line unicorn/prefer-module
      directory: resolve(__dirname, 'migrations'),
      extension: 'ts',
      tableName: 'knex_migrations',
    },
    useNullAsDefault: true,
  });

  process.on('SIGTERM', async () => {
    try {
      await knex.destroy();
      logger.debug({ msg: 'Database closed' });
    } catch (error) {
      logger.error({ error, msg: 'Failed to close database' });
    }
  });

  logger.info({ msg: 'Database ready' });

  migrateDB(knex);

  return knex;
}

const client = setupDB();

// oxlint-disable-next-line import/no-default-export
export default client;
