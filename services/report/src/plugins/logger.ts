import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

import type { Level } from '@ezreeport/logger';

import { accessLogger } from '~/lib/logger';

const requestDates = new Map<string, number>();

function isLogLevel(level: string): level is Level {
  return Object.keys(accessLogger.levels.values).includes(level);
}

/**
 * Log request with status code and time
 *
 * @param request The fastify request
 * @param reply The fastify response, if exist
 */
function logRequest(request: FastifyRequest, reply?: FastifyReply): void {
  const end = process.uptime();
  const start = requestDates.get(request.id) || end;
  requestDates.delete(request.id);

  const data = {
    duration: end * 1000 - start * 1000,
    durationUnit: 'ms',
    method: request.method,
    statusCode: reply?.statusCode ?? 0,
    url: request.url,
    user: request.user?.username,
  };

  if (reply && reply.statusCode >= 200 && reply.statusCode < 400) {
    const level = isLogLevel(request.routeOptions?.logLevel)
      ? (request.routeOptions.logLevel as Level)
      : 'info';
    accessLogger[level](data);
    return;
  }
  accessLogger.error(data);
}

/**
 * Fastify plugin to format response and log requests
 *
 * @param fastify The fastify instance
 */
// oxlint-disable-next-line require-await - Needs async
const loggerBasePlugin: FastifyPluginAsync = async (fastify) => {
  // Register request date
  // oxlint-disable-next-line require-await
  fastify.addHook('onRequest', async (request) => {
    requestDates.set(request.id, process.uptime());
  });

  // Log request
  // oxlint-disable-next-line require-await
  fastify.addHook('onResponse', async (request, reply) => {
    logRequest(request, reply);
  });

  // Log request
  // oxlint-disable-next-line require-await
  fastify.addHook('onRequestAbort', async (request) => {
    logRequest(request);
  });
};

// Register plugin
export const loggerPlugin = fp(loggerBasePlugin, {
  encapsulate: false,
  name: 'ezr-logger',
});
