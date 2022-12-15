import axios from '../lib/axios';

interface PingResultSuccess {
  name: string,
  status: true,
  elapsedTime: number,
  statusCode: number,
}

interface PingResultFail {
  name: string,
  status: false,
  error: string
}

export type PingResult = PingResultSuccess | PingResultFail;

/**
 * Get all services connected to current
 *
 * @returns The current service & the name of connected ones
 */
export const getAllConnectedServices = () => axios.$get<{ current: 'reporting-report', services: PingResult['name'][] }>('/health');

/**
 * Check connection for all connected service from current
 *
 * @returns The connection status for all services
 */
export const checkAllConnectedService = () => axios.$get<PingResult[]>('/health/all');

/**
 * Check connection of a specific service from current
 *
 * @param service The name of the service
 *
 * @returns The connection status of the service from current
 */
export const checkConnectedService = (service: PingResult['name']) => axios.$get<PingResult>(`/health/${service}`);

/**
 * Check connection of current service
 *
 * It's usefull when the app will have limited connection, or if you just want the processing time.
 *
 * @returns The connection status of current service
 */
export const checkCurrentService = async () => {
  const { content: { current } } = await getAllConnectedServices();
  return checkConnectedService(current);
};
