import { differenceInMilliseconds } from 'date-fns';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { setTimeout } from 'timers/promises';
import { elasticPing } from '../lib/elastic';
import logger from '../lib/logger';
import { name as serviceName } from '../package.json';
import { HTTPError } from '../types/errors';

const MAX_DELAY = 1000;

const pingers: Record<string, () => Promise<boolean>> = {
  [serviceName]: () => Promise.resolve(true),
  // redis: () => {
  // }
  elastic: async () => elasticPing(),
};

type Service = keyof typeof pingers;

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
const callPing = async (service: Service) => {
  const start = new Date();

  try {
    const res = await Promise.race([
      pingers[service](),
      setTimeout(MAX_DELAY, false),
    ]);

    const ms = differenceInMilliseconds(new Date(), start);
    if (!res) {
      logger.warn(`[ping] Service "${service}" is not available after ${ms}ms`);
    }
    return {
      name: service,
      success: res,
      time: ms,
      timeout: ms >= MAX_DELAY,
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
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
      Object.keys(pingers).map(callPing),
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
    const result = await callPing(service);

    res.sendJson(result);
  } catch (error) {
    res.errorJson(error);
  }
});

export default router;
