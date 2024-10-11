/* eslint-disable import/no-relative-packages */
import { PrismaClient } from '../../.prisma/client';
import { appLogger } from '~/lib/logger';

const logger = appLogger.child({ scope: 'prisma' });

const client = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
  errorFormat: process.env.NODE_ENV === 'production' ? 'minimal' : 'pretty',
});

client.$on('query', (e) => logger.trace({ ...e, durationUnit: 'ms' }));
client.$on('info', (e) => logger.info({ ...e, message: undefined, msg: e.message }));
client.$on('warn', (e) => logger.warn({ ...e, message: undefined, msg: e.message }));
client.$on('error', (e) => logger.error({ ...e, message: undefined, msg: e.message }));

export default client;

/**
 * Execute a dummy query to check if the database connection is working
 *
 * @returns If the connection is working (200)
 */
export const dbPing = async () => {
  await client.$queryRaw`SELECT 1`;
  return 200;
};

export * from '../../.prisma/client';
