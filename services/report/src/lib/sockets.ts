import type { Server as SocketIoServer, Namespace as SocketIoNamespace } from 'socket.io';

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
export const getWSNamespace = (name: string): SocketIoNamespace | undefined => namespaces.get(name);

/**
 * Register a new namespace
 *
 * @param io The socket.io server
 * @param name The namespace name
 *
 * @returns The namespace
 */
const registerWSNamespace = (io: SocketIoServer, name: string): SocketIoNamespace => {
  const namespace = io.of(`/${name}`);
  namespaces.set(name, namespace);
  return namespace;
};

/**
 * Register the generations namespace
 *
 * @param io The socket.io server
 */
function registerGenerationsNamespace(io: SocketIoServer) {
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
export function registerWSNamespaces(io: SocketIoServer) {
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
export function closeWS(io: SocketIoServer | undefined) {
  io?.close()
    .then(() => logger.debug('Service closed'))
    .catch((err) => logger.error({ msg: 'Failed to close service', err }));
}

export type Server = SocketIoServer;

export type Namespace = SocketIoNamespace;
