import { ofetch } from 'ofetch';

export type ApiAuthOptions = {
  token?: string;
  // apiKey?: string;
};

/**
 * Client for the API
 */
export const client = {
  fetch: ofetch.create({}),
};

/**
 * Prepare the client for the rest of the SDK, will update config if needed
 *
 * @param baseURL Base URL of the API
 * @param auth Auth options to be authenticated
 */
export function prepareClient(
  baseURL: string,
  auth?: ApiAuthOptions,
) {
  const headers: Record<string, string> = {};

  if (auth?.token) {
    headers.Authorization = `Bearer ${auth.token}`;
  }
  // if (auth?.apiKey) {
  //   headers['X-Api-Key'] = auth.apiKey;
  // }

  client.fetch = ofetch.create({
    baseURL,
    headers,
  });
}
