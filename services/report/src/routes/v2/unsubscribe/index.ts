import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { Readable } from 'node:stream';

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import fastifyStatic from '@fastify/static';
import { StatusCodes } from 'http-status-codes';
import { compile as handlebars } from 'handlebars';

import { z } from '@ezreeport/models/lib/zod';
import { b64ToString } from '@ezreeport/models/lib/utils';

import {
  describeErrors,
  buildSuccessResponse,
  zSuccessResponse,
} from '~/routes/v2/responses';

import { getTask, editTask } from '~/models/tasks';
import { createActivity } from '~/models/task-activity';

import { ArgumentError, NotFoundError } from '~/models/errors';

const UnsubscribeParams = z.object({
  unsubscribeId: z.string().min(1),
});

// oxlint-disable-next-line max-lines-per-function, require-await
const router: FastifyPluginAsyncZod = async (fastify) => {
  // Register assets
  await fastify.register(fastifyStatic, {
    root: join(__dirname, 'public'),
    serve: true,
    prefix: '/:unsubscribeId/',
    index: false,
    allowedPath: (path) => !path.endsWith('.html'),
  });

  fastify.route({
    method: 'GET',
    url: '/:unsubscribeId/',
    schema: {
      summary: 'Get unsubscribe page',
      tags: ['unsubscribe'],
      params: UnsubscribeParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: z.unknown(),
      },
    },
    prefixTrailingSlash: 'slash',
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const { unsubscribeId } = request.params;
      const [taskId64, to64] = decodeURIComponent(unsubscribeId).split(':');

      const task = await getTask(b64ToString(taskId64));
      if (!task) {
        throw new NotFoundError('Task not found');
      }

      const emailValidation = z.email().safeParse(b64ToString(to64));
      if (!emailValidation.success) {
        throw new ArgumentError('Invalid email');
      }

      const htmlTemplate = await readFile(
        join(__dirname, 'public/index.html'),
        'utf-8'
      );
      const html = handlebars(htmlTemplate)({
        unsubscribeId,
        task,
        email: emailValidation.data,
      });

      reply.header('Content-Type', 'text/html');
      // As it's technically a file, we make a stream out of the parsed HTML
      const stream = new Readable();
      Object.defineProperty(stream, 'filename', { get: () => 'index.html' });

      stream.push(html);
      stream.push(null);
      return stream;
    },
  });

  /**
   * Redirect to URL with trailing / to avoid issues with imports on frontend
   */
  fastify.route({
    method: 'GET',
    url: '/:unsubscribeId',
    schema: {
      hide: true,
      params: UnsubscribeParams,
    },
    prefixTrailingSlash: 'no-slash',
    // oxlint-disable-next-line require-await
    handler: async (request, reply) =>
      reply.redirect(
        `../unsubscribe/${request.params.unsubscribeId}/`,
        StatusCodes.PERMANENT_REDIRECT
      ),
  });

  fastify.route({
    method: 'POST',
    url: '/:unsubscribeId/',
    schema: {
      summary: 'Unsubscribe from a task',
      tags: ['unsubscribe'],
      params: UnsubscribeParams,
      body: z
        .object({
          unsubscribeId: UnsubscribeParams.shape.unsubscribeId,
          taskId: z.string().min(1),
          email: z.email().min(1),
        })
        .strict(),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(z.object({ success: z.boolean() })),
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const { unsubscribeId, taskId, email } = request.body;

      const [taskId64, to64] = decodeURIComponent(
        request.params.unsubscribeId
      ).split(':');
      if (
        unsubscribeId !== request.params.unsubscribeId ||
        taskId !== b64ToString(taskId64) ||
        email !== b64ToString(to64)
      ) {
        throw new ArgumentError('Integrity check failed');
      }

      const task = await getTask(taskId);
      if (!task) {
        throw new NotFoundError('Task not found');
      }

      const emailIndex = task.targets.findIndex((value) => value === email);
      if (emailIndex < 0) {
        throw new ArgumentError('Email not found in targets of task');
      }

      task.targets.splice(emailIndex, 1);
      await editTask(taskId, task);
      await createActivity({
        taskId,
        type: 'task:unsubscribe',
        message: `${email} s'est désinscrit de la tâche.`,
      });

      return buildSuccessResponse({ success: true }, reply);
    },
  });
};

// oxlint-disable-next-line no-default-exports
export default router;
