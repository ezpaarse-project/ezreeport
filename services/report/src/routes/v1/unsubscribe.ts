import { Readable } from 'node:stream';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { FastifyPluginAsync } from 'fastify';
import fastifyStatic from '@fastify/static';
import { StatusCodes } from 'http-status-codes';
import { compile as handlebars } from 'handlebars';

import { Type, type Static, assertIsSchema } from '~/lib/typebox';
import { b64ToString } from '~/lib/utils';

import { getTaskById } from '~/models/tasks';
import { NotFoundError } from '~/types/errors';

const PUBLIC_PATH = join(__dirname, 'public/unsubscribe');

const router: FastifyPluginAsync = async (fastify) => {
  // Setup decorator
  await fastify.register(
    fastifyStatic,
    {
      root: PUBLIC_PATH,
      serve: false,
    },
  );

  const UnsubscribeParams = Type.Object({
    unsubId: Type.String({ minLength: 1 }),
  });

  /**
   * Redirect to URL with trailing / to avoid issues with imports on frontend
   */
  fastify.get<{
    Params: Static<typeof UnsubscribeParams>,
  }>(
    '/:unsubId',
    {
      schema: {
        params: UnsubscribeParams,
      },
      prefixTrailingSlash: 'no-slash',
    },
    async (request, reply) => reply.redirect(
      `../unsubscribe/${request.params.unsubId}/`,
      StatusCodes.PERMANENT_REDIRECT,
    ),
  );

  /**
   * Get unsubscribe static UI
   */
  fastify.get<{
    Params: Static<typeof UnsubscribeParams>,
  }>(
    '/:unsubId/',
    {
      schema: {
        params: UnsubscribeParams,
      },
      prefixTrailingSlash: 'slash',
    },
    async (request) => {
      const { unsubId } = request.params;

      const [taskId64, to64] = decodeURIComponent(unsubId).split(':');

      const task = await getTaskById(b64ToString(taskId64));
      if (!task) {
        throw new NotFoundError('Task not found');
      }

      const email = b64ToString(to64);
      assertIsSchema(Type.String({ format: 'email' }), email, 'email');

      const template = await readFile(join(PUBLIC_PATH, 'index.html'), 'utf8');

      const html = handlebars(template)({ task, unsubId, email });

      // As it's technically a file, we make a stream out of the parsed HTML
      const stream = new Readable();
      Object.defineProperty(stream, 'filename', { get: () => 'index.html' });

      stream.push(html);
      stream.push(null);
      return stream;
    },
  );

  /**
   * Assets
   */
  const AssetsParams = Type.Intersect([
    UnsubscribeParams,
    Type.Object({
      file: Type.String(),
    }),
  ]);
  fastify.get<{
    Params: Static<typeof AssetsParams>,
  }>(
    '/:unsubId/:file(^.+)',
    {
      schema: {
        params: AssetsParams,
      },
    },
    async (request, response) => response.sendFile(request.params.file),
  );
};

export default router;
