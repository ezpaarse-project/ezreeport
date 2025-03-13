import { setTimeout } from 'node:timers/promises';

import { differenceInMilliseconds } from '~common/lib/date-fns';
import { appLogger } from '~/lib/logger';

import { elasticPing } from '~/lib/elastic';
import { dbPing } from '~/lib/prisma';

import type {
  PongType,
  ServicesType,
  SuccessPongType,
  ErrorPongType,
} from './types';

const logger = appLogger.child({ scope: 'models', model: 'ping' });

export const serviceName = 'api';

/**
 * Map of pingers that can be used
 */
const pingers: Record<ServicesType, () => Promise<number | false>> = {
  elastic: elasticPing,
  database: dbPing,
};

export const services = new Set(Object.keys(pingers) as ServicesType[]);

/**
 * Exec ping & calculate time taken.
 *
 * @param service Service name
 *
 * @returns Ping result
 */
export async function ping(
  service: ServicesType,
  timeout = 3000,
): Promise<SuccessPongType | ErrorPongType> {
  const start = new Date();

  try {
    logger.debug({
      service,
      timeout,
      msg: 'Started ping',
    });

    const res = await Promise.race([
      pingers[service](),
      setTimeout(timeout, new Error('timed out')),
    ]);

    const ms = differenceInMilliseconds(new Date(), start);
    logger.debug({
      service,
      respondedAfter: ms,
      respondedAfterUnit: 'ms',
      msg: 'Pong received',
    });

    if (res instanceof Error) {
      throw res;
    }

    if (!res) {
      logger.warn({
        service,
        timeout,
        respondedAfter: ms,
        respondedAfterUnit: 'ms',
      });
    }
    return {
      name: service,
      status: !!res,
      elapsedTime: ms,
      statusCode: typeof res === 'number' ? res : undefined,
    };
  } catch (error) {
    logger.debug({
      service,
      err: error,
      msg: 'Ping failed',
    });

    return {
      name: service,
      status: false,
      error: error instanceof Error ? error.message : `Unexpected error: ${error}`,
    };
  }
}

/**
 * Start all pings
 *
 * @returns All pongs
 */
export function pingAll(): Promise<PongType[]> {
  return Promise.all(Array.from(services).map((service) => ping(service)));
}

export {
  version as serviceVersion,
} from '../../../package.json';
