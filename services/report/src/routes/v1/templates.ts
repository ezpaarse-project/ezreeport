import type { FastifyPluginAsync } from 'fastify';
import { StatusCodes } from 'http-status-codes';

import authPlugin from '~/plugins/auth';

import config from '~/lib/config';
import { Type, type Static } from '~/lib/typebox';

import * as templates from '~/models/templates';

const router: FastifyPluginAsync = async (fastify) => {
  await fastify.register(authPlugin, { prefix: 'templates' });

  /**
   * List all templates
   */
  fastify.get(
    '/',
    {
      ezrAuth: {
        requireUser: true,
      },
    },
    async (request) => ({
      content: await templates.getAllTemplates(request.user?.isAdmin ?? false),
      meta: {
        default: config.defaultTemplate.id,
      },
    }),
  );

  /**
   * Create template
   */
  fastify.post<{
    Body: templates.FullTemplateBodyType,
  }>(
    '/',
    {
      schema: {
        body: templates.FullTemplateBody,
      },
      ezrAuth: {
        requireAdmin: true,
      },
    },
    async (request, reply) => {
      reply.status(StatusCodes.CREATED);
      return {
        content: await templates.createTemplate(request.body),
      };
    },
  );

  const SpecificTemplateParams = Type.Object({
    template: Type.String({ minLength: 1 }),
  });
  type SpecificTemplateParamsType = Static<typeof SpecificTemplateParams>;

  /**
   * Get specific template
   */
  fastify.get<{
    Params: SpecificTemplateParamsType
  }>(
    '/:template',
    {
      schema: {
        params: SpecificTemplateParams,
      },
      ezrAuth: {
        requireUser: true,
      },
    },
    async (request) => {
      const { template: id } = request.params;

      const item = await templates.getTemplateById(id);
      if (!item) {
        throw new Error(`No template named "${id}" was found`);
      }

      return { content: item };
    },
  );

  /**
   * Edit or create template
   */
  fastify.put<{
    Params: SpecificTemplateParamsType,
    Body: templates.FullTemplateBodyType,
  }>(
    '/:template',
    {
      schema: {
        params: SpecificTemplateParams,
        body: templates.FullTemplateBody,
      },
      ezrAuth: {
        requireAdmin: true,
      },
    },
    async (request, reply) => {
      const { template: id } = request.params;

      const item = await templates.getTemplateById(id);
      if (!item) {
        reply.status(StatusCodes.CREATED);
        return {
          content: await templates.createTemplate(request.body, id),
        };
      }

      return {
        content: await templates.editTemplateById(
          id,
          request.body,
        ),
      };
    },
  );

  /**
   * Delete template
   */
  fastify.delete<{
    Params: SpecificTemplateParamsType
  }>(
    '/:template',
    {
      schema: {
        params: SpecificTemplateParams,
      },
      ezrAuth: {
        requireAdmin: true,
      },
    },
    async (request) => {
      const { template: id } = request.params;

      await templates.deleteTemplateById(id);
    },
  );
};

export default router;
