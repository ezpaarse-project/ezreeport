import type { HeartbeatType } from '@ezreeport/heartbeats/types';
import { pingDB, setupDB } from '@ezreeport/database';

import { appLogger } from '~/lib/logger';

const logger = appLogger.child({ scope: 'prisma' });

const client = setupDB(logger);

// oxlint-disable-next-line import/no-default-export
export default client;

/**
 * Execute a dummy query to check if the database connection is working
 *
 * @returns If the connection is working
 */
export const dbPing = (): Promise<
  Omit<HeartbeatType, 'nextAt' | 'updatedAt'>
> => pingDB(client);
