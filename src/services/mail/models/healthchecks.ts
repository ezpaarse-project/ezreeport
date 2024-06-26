import { differenceInMilliseconds } from 'date-fns';

import { setTimeout } from 'node:timers/promises';

import { redisPing } from '~/lib/bull';
import { SMTPPing } from '~/lib/mail';
import { appLogger as logger } from '~/lib/logger';

const pingers = {
  smtp: SMTPPing,
  redis: redisPing,
} satisfies Record<string, () => Promise<boolean>>;

type Service = keyof typeof pingers;

export const services = new Set(Object.keys(pingers) as Service[]);

/**
 * Exec ping & calculate time taken.
 *
 * @param service Service name
 */
export const ping = async (
  service: Service,
  timeout = 10000,
) => {
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
      const msg = `Service [${service}] is not available after [${ms}]/[${timeout}]ms`;
      logger.warn(`[ping] ${msg}`);
      throw new Error(msg);
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : `Unexpected error: ${error}`);
  }
};
