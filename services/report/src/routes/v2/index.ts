import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  type ZodTypeProvider,
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { HTTPError, NotFoundError } from '~/models/errors';

import { openapiPlugin } from '~/plugins/openapi';

import { buildErrorResponse } from './responses';

/**
 * Utility to register a router
 *
 * @param fastify - Fastify instance
 * @param module - Module
 * @param prefix - Prefix for routes
 *
 * @returns Promise that resolves when router is registered
 */
async function registerRouter(
  fastify: FastifyInstance,
  module: Promise<{ default: FastifyPluginAsync }>,
  prefix: string
): Promise<void> {
  const { default: router } = await module;

  return fastify.register(router, { prefix });
}

// oxlint-disable-next-line max-lines-per-function, require-await
const router: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Register openapi and doc
  app.register(openapiPlugin, { transform: jsonSchemaTransform });

  // Handle errors
  // oxlint-disable-next-line promise/prefer-await-to-callbacks
  app.setErrorHandler((err, req, reply) => {
    let status = StatusCodes.INTERNAL_SERVER_ERROR;
    let error: Error | undefined;

    // If it's a http error
    if (err instanceof HTTPError) {
      status = err.statusCode;
      error = err;
    }

    // If it's a request validation error
    if (hasZodFastifySchemaValidationErrors(err)) {
      status = StatusCodes.BAD_REQUEST;
      error = new Error("Request doesn't match the schema", {
        cause: {
          context: err.validationContext,
          issues: err.validation,
        },
      });
    }

    // If it's a response validation error
    if (isResponseSerializationError(err)) {
      status = StatusCodes.INTERNAL_SERVER_ERROR;
      error = new Error(
        "Response doesn't match the schema. Please contact the administrators",
        {
          cause: {
            context: 'response',
            issues: err.cause.issues,
          },
        }
      );
    }

    if (!error) {
      error = err instanceof Error ? err : new Error(`${err}`);
    }

    return reply.status(status).send(buildErrorResponse(error, reply));
  });

  // Handle not found
  app.setNotFoundHandler(() => {
    throw new NotFoundError('Route not found');
  });

  // Register routes
  await Promise.all([
    registerRouter(fastify, import('./auth'), '/auth'),
    registerRouter(fastify, import('./crons'), '/crons'),
    registerRouter(fastify, import('./elastic'), '/elastic'),
    registerRouter(fastify, import('./generations'), '/generations'),
    registerRouter(fastify, import('./health'), '/health'),
    registerRouter(fastify, import('./recurrence'), '/recurrence'),
    registerRouter(fastify, import('./reports'), '/reports'),
    registerRouter(fastify, import('./task-activity'), '/task-activity'),
    registerRouter(fastify, import('./task-presets'), '/task-presets'),
    registerRouter(fastify, import('./task-targets'), '/task-targets'),
    registerRouter(fastify, import('./tasks'), '/tasks'),
    registerRouter(fastify, import('./template-tags'), '/template-tags'),
    registerRouter(fastify, import('./templates'), '/templates'),
    registerRouter(fastify, import('./unsubscribe'), '/unsubscribe'),
    registerRouter(fastify, import('./admin/namespaces'), '/admin/namespaces'),
    registerRouter(fastify, import('./admin/users'), '/admin/users'),
  ]);
};

// oxlint-disable-next-line no-default-export
export default router;
