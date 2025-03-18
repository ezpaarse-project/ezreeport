/* eslint-disable import/no-relative-packages */
import { appLogger } from '~/lib/logger';

import { PrismaClient } from '../../.prisma/client';
import type { HeartbeatType } from '~common/lib/heartbeats';

const logger = appLogger.child({ scope: 'prisma' });

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

export default client;

/**
 * Execute a dummy query to check if the database connection is working
 *
 * @returns If the connection is working
 */
export const dbPing = async (): Promise<HeartbeatType> => {
  const response = await client.$queryRaw`SELECT version()`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const versionMatch = /^PostgreSQL (\S+) /.exec((response as any[])[0].version);

  return {
    hostname: 'database',
    service: 'database',
    version: versionMatch?.[1],
    updatedAt: new Date(),
  };
};

export * from '../../.prisma/client';
