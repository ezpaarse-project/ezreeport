import { client } from '~/lib/fetch';
import type { ApiResponse } from '~/lib/api';

import type { ApiStatus, Pong } from './types';

/**
 * Get status of service
 *
 * @returns The current service
 */
export async function getStatus() {
  const { content } = await client.fetch<ApiResponse<ApiStatus>>('/health');
  return content;
}

/**
 * Ping all connected services at once
 *
 * @returns Result of pings
 */
export async function pingAllServices() {
  const { content } = await client.fetch<ApiResponse<Pong[]>>('/health/services');
  return content;
}

/**
 * Ping connected services
 * @param service The name of the service
 *
 * @returns Result of ping
 */
export async function pingService(service: string) {
  const { content } = await client.fetch<ApiResponse<Pong>>(`/health/services/${service}`);
  return content;
}
