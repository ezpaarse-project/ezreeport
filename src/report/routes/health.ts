import { differenceInMilliseconds } from 'date-fns';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { setTimeout } from 'node:timers/promises';
import { elasticPing } from '../lib/elastic';
import logger from '../lib/logger';
import { name as serviceName } from '../package.json';
import { HTTPError } from '../types/errors';

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
      setTimeout(timeout, false),
    ]);

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

const router = Router();

/**
 * Get all services that current one can ping (himself included)
 */
router.get('/', (_req, res) => {
  res.sendJson({
    current: serviceName,
    services: Object.keys(pingers),
  });
});

/**
 * Ping all services (himself included)
 */
router.get('/all', async (_req, res) => {
  try {
    const result = await Promise.all(
      Object.keys(pingers).map((s) => ping(s)),
    );
    res.sendJson(result);
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Ping specific service
 */
router.get('/:service', async (req, res) => {
  try {
    const { service } = req.params;

    if (!isService(service)) {
      throw new HTTPError(`Service "${service}" not found`, StatusCodes.NOT_FOUND);
    }
    const result = await ping(service);

    res.sendJson(result);
  } catch (error) {
    res.errorJson(error);
  }
});

export default router;
