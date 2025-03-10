import { differenceInMilliseconds } from 'date-fns';

import { setTimeout } from 'node:timers/promises';

// import { redisPing } from '~/lib/bull';
import { SMTPPing } from '~/lib/mailer';

const pingers = {
  smtp: SMTPPing,
  // redis: redisPing,
} satisfies Record<string, () => Promise<boolean>>;

type Service = keyof typeof pingers;

const services = new Set(Object.keys(pingers) as Service[]);

/**
 * Exec ping & calculate time taken.
 *
 * @param service Service name
 */
const ping = async (
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
      throw new Error(`Service [${service}] is not available after [${ms}]/[${timeout}]ms`);
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : `Unexpected error: ${error}`);
  }
};

export default () => Promise.all(Array.from(services).map((s) => ping(s)));
