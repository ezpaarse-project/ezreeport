import type { Logger } from '@ezreeport/logger';
import type { HeartbeatType } from '@ezreeport/heartbeats/types';

import { PrismaClient } from '../.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DATABASE_URL = new URL(process.env.DATABASE_URL ?? '');

export function setupDB(logger: Logger): PrismaClient {
  const client = new PrismaClient({
    adapter: new PrismaPg(
      { connectionString: DATABASE_URL.href },
      { schema: DATABASE_URL.searchParams.get('schema') || undefined }
    ),
    // Disable logger of Prisma, in order to events to our own
    log: [
      { level: 'query', emit: 'event' },
      { level: 'info', emit: 'event' },
      { level: 'warn', emit: 'event' },
      { level: 'error', emit: 'event' },
    ],
    // Disable formatted errors in production
    errorFormat: process.env.NODE_ENV === 'production' ? 'minimal' : 'pretty',
  });

  // Link events to logger
  client.$on('query', (event) =>
    logger.trace({ ...event, durationUnit: 'ms' })
  );
  client.$on('info', (event) =>
    logger.info({ ...event, message: undefined, msg: event.message })
  );
  client.$on('warn', (event) =>
    logger.warn({ ...event, message: undefined, msg: event.message })
  );
  client.$on('error', (event) =>
    logger.error({ ...event, message: undefined, msg: event.message })
  );

  // Test connection
  client
    .$connect()
    // oxlint-disable-next-line prefer-await-to-then
    .then(() => {
      logger.info({ msg: 'Connected to database' });
      client.$disconnect();
    })
    // oxlint-disable-next-line prefer-await-to-then,prefer-await-to-callbacks
    .catch((err) => {
      logger.fatal({ msg: 'Unable to connect to database', err });
      throw err;
    });

  return client;
}

export async function pingDB(
  client: PrismaClient
): Promise<Omit<HeartbeatType, 'nextAt' | 'updatedAt'>> {
  const response = await client.$queryRaw<
    { version: string; db: string; usage: string }[]
  >`
  SELECT version()::text,
    current_database()::text AS db,
    pg_database_size(current_database())::text AS usage
  `;

  const { version, usage, db } = response[0];
  const versionMatch = /^PostgreSQL (\S+) /.exec(version);

  return {
    hostname: DATABASE_URL.hostname,
    service: 'database',
    version: versionMatch?.[1],
    filesystems: [
      {
        name: `[database] ${db}`,
        available: -1,
        used: Number(usage),
        total: -1,
      },
    ],
  };
}
