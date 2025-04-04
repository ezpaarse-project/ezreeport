import { setupDB, pingDB } from '@ezreeport/database';

import { appLogger } from '~/lib/logger';

const logger = appLogger.child({ scope: 'prisma' });

const client = setupDB(logger);

export default client;

/**
 * Execute a dummy query to check if the database connection is working
 *
 * @returns If the connection is working
 */
export const dbPing = () => pingDB(client);
