import type { FastifyPluginAsync } from 'fastify';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

import { NotFoundError } from '~/types/errors';

/**
 * Fastify plugin to format response and log requests
 *
 * @param fastify The fastify instance
 */
const formatPlugin: FastifyPluginAsync = async (fastify) => {
  // Custom error handler
  fastify.setErrorHandler(
    (error, request, reply) => {
      reply.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR);
      return {
        content: {
          message: error.message,
          stack: process.env.NODE_ENV !== 'production'
            ? error.stack?.split('\n').map((t) => t.trim())
            : undefined,
        },
      };
    },
  );

  // Handle not found
  fastify.setNotFoundHandler((request) => {
    throw new NotFoundError(`Route ${request.method} ${request.url} not found`);
  });

  // Format response
  fastify.addHook('onSend', async (request, reply, payload) => {
    // If the content is a file
    if (payload && typeof payload === 'object' && 'filename' in payload && payload.filename) {
      return payload;
    }

    // Return NO_CONTENT if there's no data
    if (!payload || reply.statusCode === StatusCodes.NO_CONTENT) {
      // If status wasn't modified
      if (reply.statusCode === StatusCodes.OK) {
        reply.code(StatusCodes.NO_CONTENT);
      }

      return null;
    }

    // Ensure that data is an object
    let data = payload;
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    if (typeof data !== 'object') {
      data = { content: data };
    }

    // Format
    return JSON.stringify({
      apiVersion: reply.apiVersion,
      status: {
        code: reply.statusCode,
        message: getReasonPhrase(reply.statusCode),
      },
      ...data,
    });
  });
};
// Tell fastify to not create a new scope
// @ts-expect-error
formatPlugin[Symbol.for('skip-override')] = true;

export default formatPlugin;
