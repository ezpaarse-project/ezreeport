import { ofetch } from 'ofetch';
import { io, type Socket } from 'socket.io-client';

export interface ApiAuthOptions {
  token?: string;
  // apiKey?: string;
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
  token: '',
  fetch: ofetch.create({}),
  socket: (() => {
    // Will be init later
  }) as SocketCreator,
};

const prepareSocketCreator =
  (baseURL: URL, auth?: ApiAuthOptions): SocketCreator =>
  (namespaceName, rooms) => {
    let namespace = sockets.get(namespaceName);
    const haveSameRooms = (namespace?.rooms ?? []).every((rs) =>
      (rooms ?? []).includes(rs)
    );
    if (!haveSameRooms) {
      namespace?.con.disconnect();
      namespace = undefined;
    }
    if (!namespace) {
      const url = new URL(namespaceName, baseURL);
      url.protocol = url.protocol.replace('http', 'ws');

      try {
        namespace = {
          con: io(url.href, {
            auth: auth || undefined,
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
  // if (auth?.apiKey) {
  //   headers['X-Api-Key'] = auth.apiKey;
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
