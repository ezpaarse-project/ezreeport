import type { ExtendedError, Socket } from 'socket.io';

import { ensureArray } from '@ezreeport/models/lib/utils';

import type { NamespaceType } from '@ezreeport/models/namespaces';
import type { UserType } from '~/models/users/types';
import {
  getUserByToken, getNamespacesOfUser, getNamespacesOfAdmin, type Access,
} from '~/models/access';

type WSMiddleware = (socket: Socket, next: (err?: ExtendedError) => void) => void;

/**
 * Middleware that checks if a user token is provided, valid and used by a user.
 */
export const requireUser: WSMiddleware = (socket, next) => {
  const { token } = socket.handshake.auth;
  if (!token) {
    next(new Error('Requires user'));
    return;
  }

  getUserByToken(token)
    .then((user) => {
      if (!user) {
        // oxlint-disable-next-line promise/no-callback-in-promise
        next(new Error('User not found'));
        return;
      }
      Object.assign(socket.request, { user });
      // oxlint-disable-next-line promise/no-callback-in-promise
      next();
    })
    .catch((err) => {
      // oxlint-disable-next-line promise/no-callback-in-promise
      next(err);
    });
};

/**
 * Creates a middleware that restricts the socket to the namespaces owned by the user
 *
 * @param access The minimum required access
 *
 * @returns The middleware
 */
export const restrictToOwnedNamespaces: (access: Access) => WSMiddleware = (access) => (
  socket,
  next,
) => {
  const { user } = socket.request as unknown as { user: UserType };
  if (!user) {
    next(new Error('Requires user'));
    return;
  }

  const rooms = new Set(
    ensureArray(socket.handshake.query.rooms ?? []).filter((v): v is string => !!v),
  );

  const joinRoomsOfNamespaces = (namespacesOfUser: NamespaceType[]) => {
    if (rooms.size <= 0) {
      socket.join(namespacesOfUser.map(({ id }) => id));
      return;
    }

    socket.join(
      namespacesOfUser.map(({ id }) => id)
        .filter((id) => rooms.has(id)),
    );
  };

  if (user.isAdmin) {
    getNamespacesOfAdmin()
      .then((namespaces) => {
        joinRoomsOfNamespaces(namespaces);
        // oxlint-disable-next-line promise/no-callback-in-promise
        next();
      });
    return;
  }

  getNamespacesOfUser(user.username, access)
    .then((namespaces) => {
      joinRoomsOfNamespaces(namespaces);
      // oxlint-disable-next-line promise/no-callback-in-promise
      next();
    });
};
