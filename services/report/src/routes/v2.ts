import { join } from 'node:path';

import { StatusCodes } from 'http-status-codes';
import type { FastifyPluginAsync } from 'fastify';
import autoLoad from '@fastify/autoload';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';

import { simplifyZodIssue } from '@ezreeport/models/lib/zod';

import openapi from '~/plugins/openapi';

import { NotFoundError } from '~/models/errors';

import { buildErrorResponse } from './v2/responses';

// oxlint-disable-next-line max-lines-per-function, require-await
const router: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Register openapi and doc
  app.register(openapi, { transform: jsonSchemaTransform });

  // Handle errors
  // oxlint-disable-next-line promise/prefer-await-to-callbacks
  app.setErrorHandler((err, req, reply) => {
    let status = StatusCodes.INTERNAL_SERVER_ERROR;
    let error: Error | undefined;

    // If it's a request validation error
    if (hasZodFastifySchemaValidationErrors(err)) {
      status = StatusCodes.BAD_REQUEST;
      error = new Error("Request doesn't match the schema", {
        cause: err.validation,
      });
    }

    // If it's a response validation error
    if (isResponseSerializationError(err)) {
      const cause = err.cause.issues.map((issue) => simplifyZodIssue(issue));
      error = new Error(
        "Response doesn't match the schema. Please contact the administrators",
        { cause }
      );
    }

    // If it's a http error
    if (err.statusCode) {
      status = err.statusCode;
      error = err;
    }

    return reply.status(status).send(buildErrorResponse(error ?? err, reply));
  });

  // Handle not found
  app.setNotFoundHandler(() => {
    throw new NotFoundError('Route not found');
  });

  // Register routes
  app.register(autoLoad, {
    dir: join(__dirname, 'v2'),
    maxDepth: 2,
  });
};

// oxlint-disable-next-line no-default-exports
export default router;
