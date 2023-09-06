import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';

import { differenceInMilliseconds } from '~/lib/date-fns';
import { accessLogger } from '~/lib/logger';

const requestDates = new Map<string, Date>();

/**
 * Log request with status code and time
 *
 * @param request The fastify request
 * @param reply The fastify response, if exist
 */
const logRequest = (request: FastifyRequest, reply?: FastifyReply) => {
  const end = new Date();
  const start = requestDates.get(request.id) || new Date();
  requestDates.delete(request.id);

  const duration = differenceInMilliseconds(end, start);

  let log = accessLogger.error;
  if (reply && reply.statusCode >= 200 && reply.statusCode < 300) {
    log = accessLogger.info;
  }

  log(`${request.method} ${request.url} - ${reply?.statusCode ?? 0} (${duration})`);
};

/**
 * Fastify plugin to format response and log requests
 *
 * @param fastify The fastify instance
 */
const loggerPlugin: FastifyPluginAsync = async (fastify) => {
  // Register request date
  fastify.addHook('onRequest', async (request) => {
    requestDates.set(request.id, new Date());
  });

  // Log request
  fastify.addHook('onResponse', async (request, reply) => {
    logRequest(request, reply);
  });

  // Log request
  fastify.addHook('onRequestAbort', async (request) => {
    logRequest(request);
  });
};
// Tell fastify to not create a new scope
// @ts-expect-error
loggerPlugin[Symbol.for('skip-override')] = true;

export default loggerPlugin;
