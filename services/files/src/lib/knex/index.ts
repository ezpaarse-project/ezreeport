import createKnex, { type Knex } from 'knex';

import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import config from '~/lib/config';
import { appLogger } from '~/lib/logger';

const { paths: { db: dbPath } } = config;

const logger = appLogger.child({ scope: 'knex' });

async function migrateDB(knex: Knex) {
  try {
    const [all, toDo] = await knex.migrate.list();
    logger.debug({ msg: 'Found migrations', all, toDo });

    const [, done] = await knex.migrate.latest();
    logger.info({ msg: 'Database migrated', done });
  } catch (err) {
    logger.error({ msg: 'Database migration failed', err });
  }
}

function setupDB() {
  mkdirSync(dbPath, { recursive: true });

  const knex = createKnex({
    client: 'better-sqlite3',
    log: {
      debug: (...args) => logger.debug(...args),
      error: (...args) => logger.error(...args),
      warn: (...args) => logger.warn(...args),
    },
    connection: {
      filename: resolve(dbPath, 'ezrFiles.db'),
    },
    migrations: {
      directory: resolve(__dirname, 'migrations'),
      tableName: 'knex_migrations',
      extension: 'ts',
    },
    useNullAsDefault: true,
  });

  process.on('SIGTERM', () => {
    knex.destroy()
      .then(() => logger.debug({ msg: 'Database closed' }))
      .catch((err) => logger.error({ msg: 'Failed to close database', err }));
  });

  logger.info({ msg: 'Database ready' });

  migrateDB(knex);

  return knex;
}

const client = setupDB();

export default client;
