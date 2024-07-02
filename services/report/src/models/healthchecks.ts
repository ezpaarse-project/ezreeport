import { setTimeout } from 'node:timers/promises';

import { differenceInMilliseconds } from '~/lib/date-fns';
import { appLogger as logger } from '~/lib/logger';

import { elasticPing } from '~/lib/elastic';
import { redisPing } from '~/lib/bull';
import { dbPing } from '~/lib/prisma';

import { name as serviceName } from '../../package.json';
import { NotFoundError } from '~/types/errors';

const pingers: Record<string, () => Promise<number | false>> = {
  [serviceName]: () => Promise.resolve(200),
  elastic: elasticPing,
  redis: redisPing,
  database: dbPing,
};

export const services = new Set(Object.keys(pingers));

interface Pong {
  name: string;
  status: boolean;
}

interface SuccessfulPong extends Pong {
  elapsedTime: number;
  statusCode?: number;
}

interface ErrorPong extends Pong {
  status: false;
  error: string;
}

/**
 * Check if given string is a valid service
 *
 * @param service The input service
 *
 * @returns Service is valid
 */
export const isService = (service: string) => {
  if (!services.has(service)) {
    throw new NotFoundError(`Service [${service}] not found`);
  }
  return true;
};

/**
 * Exec ping & calculate time taken.
 *
 * @param service Service name
 *
 * @returns Ping result
 */
export const ping = async (
  service: string,
  timeout = 3000,
): Promise<SuccessfulPong | ErrorPong> => {
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
      logger.warn(`[ping] Service [${service}] is not available after [${ms}]/[${timeout}]ms`);
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
      error: error instanceof Error ? error.message : `Unexpected error: ${error}`,
    };
  }
};

export {
  name as serviceName,
  version as serviceVersion,
} from '../../package.json';
