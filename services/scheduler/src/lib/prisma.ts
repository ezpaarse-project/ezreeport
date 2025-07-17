import { setupDB, pingDB } from '@ezreeport/database';
import type { HeartbeatType } from '@ezreeport/heartbeats/types';

import { appLogger } from '~/lib/logger';

const logger = appLogger.child({ scope: 'prisma' });

const client = setupDB(logger);

export default client;

/**
 * Execute a dummy query to check if the database connection is working
 *
 * @returns If the connection is working
 */
export const dbPing = (): Promise<HeartbeatType> => pingDB(client);
