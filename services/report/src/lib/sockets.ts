import type { Server, Namespace as SocketIoNamespace } from 'socket.io';

import { appLogger } from '~/lib/logger';

import { requireUser, restrictToOwnedNamespaces } from '~/plugins/auth-ws';

const logger = appLogger.child({ scope: 'websockets' });

const namespaces = new Map<string, SocketIoNamespace>();

/**
 * Get a socket namespace by name
 *
 * @param name The namespace name
 *
 * @returns The namespace if found
 */
export const getWSNamespace = (name: string): SocketIoNamespace | undefined =>
  namespaces.get(name);

/**
 * Register a new namespace
 *
 * @param io The socket.io server
 * @param name The namespace name
 *
 * @returns The namespace
 */
const registerWSNamespace = (io: Server, name: string): SocketIoNamespace => {
  const namespace = io.of(`/${name}`);
  namespaces.set(name, namespace);
  return namespace;
};

/**
 * Register the generations namespace
 *
 * @param io The socket.io server
 */
function registerGenerationsNamespace(io: Server): void {
  registerWSNamespace(io, 'generations')
    .use(requireUser)
    .use(restrictToOwnedNamespaces('READ_WRITE'));

  logger.debug({
    msg: 'Namespace created',
    namespace: 'generations',
  });
}

/**
 * Register all socket namespaces
 *
 * @param io The socket.io server
 */
export function registerWSNamespaces(io: Server): void {
  const start = process.uptime();

  registerGenerationsNamespace(io);

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Service listening',
  });
}

/**
 * Close the socket.io server
 *
 * @param io The socket.io server
 */
export async function closeWS(io: Server | undefined): Promise<void> {
  try {
    await io?.close();
    logger.debug('Service closed');
  } catch (err) {
    logger.error({ msg: 'Failed to close service', err });
  }
}

export type Namespace = SocketIoNamespace;

declare module 'fastify' {
  // oxlint-disable-next-line typescript/consistent-type-definitions
  interface FastifyInstance {
    io: Server<{ hello: string }>;
  }
}
