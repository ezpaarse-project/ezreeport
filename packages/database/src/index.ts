import type { Logger } from '@ezreeport/logger';
import type { HeartbeatType } from '@ezreeport/heartbeats/types';

// eslint-disable-next-line import/no-relative-packages
import { PrismaClient } from '../.prisma/client';

const DATABASE_HOSTNAME = new URL(process.env.DATABASE_URL ?? '').hostname;

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
  const response = await client.$queryRaw`SELECT version()`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const versionMatch = /^PostgreSQL (\S+) /.exec((response as any[])[0].version);

  return {
    hostname: DATABASE_HOSTNAME,
    service: 'database',
    version: versionMatch?.[1],
    updatedAt: new Date(),
  };
}
