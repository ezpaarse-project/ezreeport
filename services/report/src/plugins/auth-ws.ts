import type { ExtendedError, Socket } from 'socket.io';

import { ensureArray } from '@ezreeport/models/lib/utils';

import type { NamespaceType } from '@ezreeport/models/namespaces';
import type { UserType } from '~/models/users/types';
import {
  getUserByToken,
  getNamespacesOfUser,
  getNamespacesOfAdmin,
  type Access,
} from '~/models/access';

type Next = (err?: ExtendedError) => void;

type WSMiddleware = (socket: Socket, next: Next) => void;

async function getSocketUserByToken(
  socket: Socket,
  token: string,
  next: Next
): Promise<void> {
  try {
    const user = await getUserByToken(token);
    if (!user) {
      throw new Error('User not found');
    }
    Object.assign(socket.request, { user });
    next();
  } catch (err) {
    next(err instanceof Error ? err : new Error(`${err}`));
  }
}

/**
 * Middleware that checks if a user token is provided, valid and used by a user.
 */
export const requireUser: WSMiddleware = (socket, next) => {
  const { token } = socket.handshake.auth;
  if (!token) {
    next(new Error('Requires user'));
    return;
  }

  getSocketUserByToken(socket, token, next);
};

function joinRoomsOfNamespaces(
  socket: Socket,
  rooms: Set<string>,
  namespacesOfUser: NamespaceType[]
) {
  if (rooms.size <= 0) {
    socket.join(namespacesOfUser.map(({ id }) => id));
    return;
  }

  socket.join(
    namespacesOfUser.map(({ id }) => id).filter((id) => rooms.has(id))
  );
}

async function joinRoomsOfAdmin(
  socket: Socket,
  rooms: Set<string>,
  next: Next
): Promise<void> {
  const namespaces = await getNamespacesOfAdmin();
  joinRoomsOfNamespaces(socket, rooms, namespaces);
  next();
}

async function joinRoomsOfUser(
  socket: Socket,
  rooms: Set<string>,
  username: string,
  access: Access,
  next: Next
): Promise<void> {
  const namespaces = await getNamespacesOfUser(username, access);
  joinRoomsOfNamespaces(socket, rooms, namespaces);
  next();
}

/**
 * Creates a middleware that restricts the socket to the namespaces owned by the user
 *
 * @param access The minimum required access
 *
 * @returns The middleware
 */
export const restrictToOwnedNamespaces =
  (access: Access): WSMiddleware =>
  (socket, next) => {
    const { user } = socket.request as unknown as { user: UserType };
    if (!user) {
      next(new Error('Requires user'));
      return;
    }

    const rooms = new Set<string>(
      ensureArray(socket.handshake.query.rooms ?? []).filter(
        (value): value is string => !!value
      )
    );

    if (user.isAdmin) {
      joinRoomsOfAdmin(socket, rooms, next);
      return;
    }

    joinRoomsOfUser(socket, rooms, user.username, access, next);
  };
