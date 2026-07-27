import { join } from 'node:path';

import type { FastifyPluginAsync } from 'fastify';
import autoLoad from '@fastify/autoload';
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

import { buildErrorResponse } from './v2/responses';

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
  app.register(autoLoad, {
    // oxlint-disable-next-line unicorn/prefer-module
    dir: join(__dirname, 'v2'),
    maxDepth: 2,
  });
};

// oxlint-disable-next-line no-default-export
export default router;
