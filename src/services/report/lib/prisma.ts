import { PrismaClient } from '@prisma/client';
import logger from '~/lib/logger';

const client = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
  errorFormat: 'pretty',
});

client.$on('query', (e) => logger.debug(`[prisma] ${e.query} - ${e.params} (${e.duration}ms)`));
client.$on('info', (e) => logger.info(`[prisma] ${e.message}`));
client.$on('warn', (e) => logger.warn(`[prisma] ${e.message}`));
client.$on('error', (e) => logger.error(`[prisma] ${e.message}`));

export default client;
