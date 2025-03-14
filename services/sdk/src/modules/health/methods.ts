import { client } from '~/lib/fetch';
import type { ApiResponse } from '~/lib/api';
import { transformCreatedUpdated } from '~/lib/transform';

import type {
  ApiService,
  ApiStatus,
  RawApiStatus,
  RawApiService,
} from './types';

export const transformService = (s: RawApiService): ApiService => ({
  ...transformCreatedUpdated(s),
});

/**
 * Get status of service
 *
 * @returns The current service
 */
export async function getStatus(): Promise<ApiStatus> {
  const { content } = await client.fetch<ApiResponse<RawApiStatus>>('/health');
  return {
    ...content,
    services: content.services.map(transformService),
  };
}

/**
 * Ping all connected services at once
 *
 * @returns Result of pings
 */
export async function pingAllServices(): Promise<ApiService[]> {
  const { content } = await client.fetch<ApiResponse<RawApiService[]>>('/health/services');
  return content.map(transformService);
}

/**
 * Ping connected services
 * @param service The name of the service
 *
 * @returns Result of ping
 */
export async function pingService(service: string): Promise<ApiService> {
  const { content } = await client.fetch<ApiResponse<RawApiService>>(`/health/services/${service}`);
  return transformService(content);
}
