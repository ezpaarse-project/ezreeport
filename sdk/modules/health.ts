import axios from '../lib/axios';

type Pingable = 'reporting-report' | 'elastic';

interface PingResultSuccess<Service extends Pingable> {
  name: Service,
  status: true,
  elapsedTime: number,
  statusCode: number,
}

interface PingResultFail<Service extends Pingable> {
  name: Service,
  status: false,
  error: string
}

export type PingResult<S extends Pingable> = PingResultSuccess<S> | PingResultFail<S>;

export type AnyPingResult = PingResult<Pingable>;

/**
 * Get all services connected to current
 *
 * @returns The current service & the name of connected ones
 */
export const getAllConnectedServices = () => axios.$get<{ current: 'reporting-report', services: Pingable[] }>('/health');

/**
 * Check connection for all connected service from current
 *
 * @returns The connection status for all services
 */
export const checkAllConnectedService = () => axios.$get<PingResult<Pingable>[]>('/health/all');

/**
 * Check connection of a specific service from current
 *
 * @param service The name of the service
 *
 * @returns The connection status of the service from current
 */
export const checkConnectedService = <Service extends Pingable>(service: Service) => axios.$get<PingResult<Service>>(`/health/${service}`);

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
