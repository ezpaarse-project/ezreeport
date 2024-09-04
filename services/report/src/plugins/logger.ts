import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

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

  log({
    method: request.method,
    url: request.url,
    statusCode: reply?.statusCode ?? 0,
    duration,
  });
};

/**
 * Fastify plugin to format response and log requests
 *
 * @param fastify The fastify instance
 */
const loggerBasePlugin: FastifyPluginAsync = async (fastify) => {
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

// Register plugin
const loggerPlugin = fp(
  loggerBasePlugin,
  {
    name: 'ezr-logger',
    encapsulate: false,
  },
);

export default loggerPlugin;
