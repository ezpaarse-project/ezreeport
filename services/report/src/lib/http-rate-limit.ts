import type { RouteOptions } from 'fastify';
import type {
  FastifyRateLimitOptions,
  FastifyRateLimitStore,
} from '@fastify/rate-limit';

import { appLogger } from '~/lib/logger';
import prisma from '~/lib/prisma';

const logger = appLogger.child({ scope: 'http-rate-limit' });

export class RateLimitStore implements FastifyRateLimitStore {
  private route = '';

  constructor(private options: FastifyRateLimitOptions) {}

  protected routeKey(route: string): string {
    if (route) {
      this.route = route;
    }
    return route;
  }

  async incr(
    key: string,
    // oxlint-disable-next-line promise/prefer-await-to-callbacks - Used by plugin
    callback: (
      error: Error | null,
      result?: { current: number; ttl: number }
    ) => void
  ): Promise<void> {
    // types are kinda tricky with this lib
    const { timeWindow, max } = this.options as {
      timeWindow: number;
      max: number;
    };

    const now = Date.now();
    const ttl = new Date(now + timeWindow);

    const source_route = {
      source: key,
      route: this.route,
    };

    const sendRateLimit = (payload: {
      current: number;
      ttl: Date | null;
    }): void => {
      process.nextTick(callback, null, {
        current: payload.current,
        ttl: payload.ttl ? payload.ttl?.getTime() - now : 0,
      });
    };

    try {
      await prisma.$transaction(async (tx) => {
        const row = await tx.rateLimit.findUnique({ where: { source_route } });

        if (row && (row.ttl?.getTime() ?? 0) > now) {
          const payload = { current: (row.count ?? 0) + 1, ttl: row.ttl };

          if ((row.count ?? 0) < max) {
            await tx.rateLimit.update({
              where: { source_route },
              data: { count: payload.current },
            });

            logger.debug({
              msg: 'Registered rate limit',
              source_route,
              payload,
            });
          }

          // If we were already at max no need to UPDATE but we must still send d.count + 1 to trigger rate limit.
          sendRateLimit(payload);
          return;
        }

        const payload = { current: 1, ttl: row?.ttl || ttl };

        await tx.rateLimit.upsert({
          where: { source_route },
          create: {
            route: source_route.route,
            source: source_route.source,
            count: 1,
            ttl: payload.ttl,
          },
          update: {
            count: 1,
            ttl,
          },
        });

        logger.debug({ msg: 'Registered rate limit', source_route, payload });

        sendRateLimit(payload);
      });
    } catch (err) {
      logger.error({ msg: 'Failed to register rate limit', source_route, err });

      sendRateLimit({ current: 0, ttl: null });
    }
  }

  child(
    routeOptions: RouteOptions & { path: string; prefix: string }
  ): FastifyRateLimitStore {
    const options = { ...this.options, ...routeOptions, global: false };
    // types are kinda tricky with this lib
    const { routeInfo } = routeOptions as unknown as {
      routeInfo: RouteOptions;
    };

    const store = new RateLimitStore(options);

    store.routeKey(routeInfo.method + routeInfo.url);
    return store;
  }
}
