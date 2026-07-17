import { type $Fetch, ofetch } from 'ofetch';
import { type Socket, io } from 'socket.io-client';

export interface ApiAuthOptions {
  token?: string;
  // ApiKey?: string;
}

type SocketCreator = (
  namespace: string,
  rooms?: string[]
) => Socket | undefined;

const sockets = new Map<string, { con: Socket; rooms?: string[] }>();

/**
 * Client for the API
 */
export const client = {
  fetch: ofetch.create({}) as $Fetch,
  socket: (() => {
    // Will be init later
  }) as SocketCreator,
  token: '',
};

const prepareSocketCreator = (
  baseURL: URL,
  auth?: ApiAuthOptions
): SocketCreator => {
  const wsURL = new URL(baseURL);
  wsURL.protocol = wsURL.protocol.replace('http', 'ws');
  // Ensure URL ends with / so we'll respect the baseURL when getting socket.io path
  if (wsURL.href.at(-1) !== '/') {
    wsURL.href = `${wsURL.href}/`;
  }
  // Respect baseURL for socket.io (allows running behind reverse proxy)
  const socketIoPath = new URL('socket.io/', wsURL).pathname;

  return (namespaceName, rooms) => {
    let namespace = sockets.get(namespaceName);
    const haveSameRooms = (namespace?.rooms ?? []).every((rs) =>
      (rooms ?? []).includes(rs)
    );
    if (!haveSameRooms) {
      namespace?.con.disconnect();
      namespace = undefined;
    }
    if (!namespace) {
      const url = new URL(namespaceName, wsURL);

      try {
        namespace = {
          con: io(url.href, {
            auth: auth || undefined,
            path: socketIoPath,
            query: rooms ? { rooms } : undefined,
          }),
          rooms,
        };
        sockets.set(namespaceName, namespace);
      } catch (error) {
        // oxlint-disable-next-line no-console
        console.error(
          `[ezreeport-sdk-js] Couldn't create socket for ${namespaceName}`,
          error
        );
        return;
      }
    }

    return namespace.con;
  };
};

/**
 * Prepare the client for the rest of the SDK, will update config if needed
 *
 * @param baseURL Base HTTP URL of the API
 * @param auth Auth options to be authenticated
 */
export function prepareClient(
  baseURL: string | URL,
  auth?: ApiAuthOptions
): void {
  // Create HTTP client
  const headers: Record<string, string> = {};

  if (auth?.token) {
    headers.Authorization = `Bearer ${auth.token}`;
  }
  // If (auth?.apiKey) {
  //   Headers['X-Api-Key'] = auth.apiKey;
  // }

  let href;
  let url;
  if (typeof baseURL === 'string') {
    href = baseURL;
    url = new URL(baseURL);
  } else {
    href = baseURL.href;
    url = baseURL;
  }

  client.fetch = ofetch.create({
    baseURL: href,
    headers,
  });

  // Set function to handle sockets
  client.socket = prepareSocketCreator(url, auth);
}
