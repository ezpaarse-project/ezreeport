import { StatusCodes } from 'http-status-codes';
import { setTimeout } from 'node:timers/promises';
import { differenceInMilliseconds } from '~/lib/date-fns';
import { elasticPing } from '~/lib/elastic';
import { CustomRouter } from '~/lib/express-utils';
import logger from '~/lib/logger';
import { name as serviceName } from '~/package.json';
import { HTTPError } from '~/types/errors';

const pingers: Record<string, () => Promise<number | false>> = {
  [serviceName]: () => Promise.resolve(200),
  // redis: () => {
  // }
  elastic: elasticPing,
};

type Service = keyof typeof pingers;

type Pong = { name: string } & (
  { status: boolean, elapsedTime: number, statusCode?: number }
  | { status: false, error: string }
);

/**
 * Check if given string is a valid service
 *
 * @param data The input data
 *
 * @returns Service is valid
 */
const isService = (data: string): data is Service => Object.keys(pingers).includes(data);

/**
 * Exec ping & calculate time taken.
 *
 * @param service Service name
 *
 * @returns Ping result
 */
const ping = async (
  service: Service,
  timeout = 3000,
): Promise<Pong> => {
  const start = new Date();

  try {
    const res = await Promise.race([
      pingers[service](),
      setTimeout(timeout, new Error('timed out')),
    ]);

    if (res instanceof Error) {
      throw res;
    }

    const ms = differenceInMilliseconds(new Date(), start);
    if (!res) {
      logger.warn(`[ping] Service "${service}" is not available after ${ms}/${timeout}ms`);
    }
    return {
      name: service,
      status: !!res,
      elapsedTime: ms,
      statusCode: typeof res === 'number' ? res : undefined,
    };
  } catch (error) {
    return {
      name: service,
      status: false,
      error: (error as Error).message,
    };
  }
};

const router = CustomRouter('health')
  /**
   * Get all services that current one can ping (himself included)
   */
  .createRoute('GET /', (_req, _res) => ({
    current: serviceName,
    services: Object.keys(pingers),
  }))

  /**
   * Ping all services (himself included)
   */
  .createRoute('GET /all', (_req, _res) => Promise.all(
    Object.keys(pingers).map((s) => ping(s)),
  ))

  /**
   * Ping specific service
   */
  .createRoute('GET /:service', async (req, _res) => {
    const { service } = req.params;

    if (!isService(service)) {
      throw new HTTPError(`Service "${service}" not found`, StatusCodes.NOT_FOUND);
    }
    const result = await ping(service);

    return result;
  });

export default router;
