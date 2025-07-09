import type { Logger } from '@ezreeport/logger';
import type { HeartbeatType } from '@ezreeport/heartbeats/types';

import { PrismaClient } from '../.prisma/client';

const DATABASE_URL = new URL(process.env.DATABASE_URL ?? '');
const DATABASE_HOST = DATABASE_URL.hostname;

export function setupDB(logger: Logger) {
  const client = new PrismaClient({
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
  client.$on('query', (e) => logger.trace({ ...e, durationUnit: 'ms' }));
  client.$on('info', (e) => logger.info({ ...e, message: undefined, msg: e.message }));
  client.$on('warn', (e) => logger.warn({ ...e, message: undefined, msg: e.message }));
  client.$on('error', (e) => logger.error({ ...e, message: undefined, msg: e.message }));

  // Test connection
  client.$connect().then(() => {
    logger.info({ msg: 'Connected to database' });
    client.$disconnect();
  });

  return client;
}

export async function pingDB(client: PrismaClient): Promise<HeartbeatType> {
  const response = await client.$queryRaw`
  SELECT version(),
    current_database() AS db,
    pg_database_size(current_database()) AS usage
  `;

  const { version, usage, db } = (response as any[])[0];
  const versionMatch = /^PostgreSQL (\S+) /.exec(version);

  return {
    hostname: DATABASE_HOST,
    service: 'database',
    version: versionMatch?.[1],
    updatedAt: new Date(),
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
