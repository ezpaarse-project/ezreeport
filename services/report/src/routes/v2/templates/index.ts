import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezreeport/models/lib/zod';
import config from '~/lib/config';

import authPlugin from '~/plugins/auth';
import { Access } from '~/models/access';

import * as responses from '~/routes/v2/responses';

import { buildPaginatedResponse } from '~/models/pagination';
import { PaginationQuery, PaginationResponse } from '~/models/pagination/types';

import * as templates from '~/models/templates';
import { Template, InputTemplate, TemplateQueryFilters } from '~/models/templates/types';

import { NotFoundError } from '~/models/errors';
import { appLogger } from '~/lib/logger';

const SpecificTemplateParams = z.object({
  id: z.string().min(1)
    .describe('ID of the template'),
});

const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(authPlugin);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get all templates',
      tags: ['templates'],
      querystring: PaginationQuery.and(TemplateQueryFilters),
      response: {
        [StatusCodes.OK]: PaginationResponse(
          Template.omit({ body: true }),
          z.object({ default: z.string() }),
        ),
        [StatusCodes.BAD_REQUEST]: responses.schemas[StatusCodes.BAD_REQUEST],
        [StatusCodes.UNAUTHORIZED]: responses.schemas[StatusCodes.UNAUTHORIZED],
        [StatusCodes.FORBIDDEN]: responses.schemas[StatusCodes.FORBIDDEN],
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
        access: Access.READ_WRITE,
      },
    },
    handler: async (request, reply) => {
      // Extract pagination and filters from query
      const {
        page,
        count,
        sort,
        order,
        ...filters
      } = request.query;

      const content = await templates.getAllTemplates(
        filters,
        {
          page,
          count,
          sort,
          order,
        },
      );

      return buildPaginatedResponse(
        content,
        {
          default: config.defaultTemplate.id,
          page: request.query.page,
          total: await templates.countTemplates(filters),
          count: content.length,
        },
        reply,
      );
    },
  });

  fastify.route({
    method: 'POST',
    url: '/',
    schema: {
      summary: 'Create template',
      tags: ['templates'],
      body: InputTemplate,
      response: {
        [StatusCodes.CREATED]: responses.SuccessResponse(Template),
        [StatusCodes.BAD_REQUEST]: responses.schemas[StatusCodes.BAD_REQUEST],
        [StatusCodes.UNAUTHORIZED]: responses.schemas[StatusCodes.UNAUTHORIZED],
        [StatusCodes.FORBIDDEN]: responses.schemas[StatusCodes.FORBIDDEN],
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    config: {
      ezrAuth: {
        requireAdmin: true,
      },
    },
    handler: async (request, reply) => {
      const content = await templates.createTemplate(request.body);

      reply.status(StatusCodes.CREATED);
      return responses.buildSuccessResponse(content, reply);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: {
      summary: 'Get specific template',
      tags: ['templates'],
      params: SpecificTemplateParams,
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(Template),
        [StatusCodes.BAD_REQUEST]: responses.schemas[StatusCodes.BAD_REQUEST],
        [StatusCodes.UNAUTHORIZED]: responses.schemas[StatusCodes.UNAUTHORIZED],
        [StatusCodes.FORBIDDEN]: responses.schemas[StatusCodes.FORBIDDEN],
        [StatusCodes.NOT_FOUND]: responses.schemas[StatusCodes.NOT_FOUND],
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
        access: Access.READ,
      },
    },
    handler: async (request, reply) => {
      const content = await templates.getTemplate(request.params.id);

      if (!content) {
        throw new NotFoundError(`Template ${request.params.id} not found`);
      }

      return responses.buildSuccessResponse(content, reply);
    },
  });

  fastify.route({
    method: 'PUT',
    url: '/:id',
    schema: {
      summary: 'Upsert specific template',
      tags: ['templates'],
      params: SpecificTemplateParams,
      body: InputTemplate,
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(Template),
        [StatusCodes.BAD_REQUEST]: responses.schemas[StatusCodes.BAD_REQUEST],
        [StatusCodes.UNAUTHORIZED]: responses.schemas[StatusCodes.UNAUTHORIZED],
        [StatusCodes.FORBIDDEN]: responses.schemas[StatusCodes.FORBIDDEN],
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    config: {
      ezrAuth: {
        requireAdmin: true,
      },
    },
    handler: async (request, reply) => {
      const doesExists = await templates.doesTemplateExist(request.params.id);
      appLogger.debug(request.params.id);

      let template;
      if (doesExists) {
        template = await templates.editTemplate(request.params.id, request.body);
      } else {
        template = await templates.createTemplate({ ...request.body, id: request.params.id });
      }

      return responses.buildSuccessResponse(template, reply);
    },
  });

  fastify.route({
    method: 'DELETE',
    url: '/:id',
    schema: {
      summary: 'Delete specific template',
      tags: ['templates'],
      params: SpecificTemplateParams,
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(z.object({ deleted: z.boolean() })),
        [StatusCodes.BAD_REQUEST]: responses.schemas[StatusCodes.BAD_REQUEST],
        [StatusCodes.UNAUTHORIZED]: responses.schemas[StatusCodes.UNAUTHORIZED],
        [StatusCodes.FORBIDDEN]: responses.schemas[StatusCodes.FORBIDDEN],
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    config: {
      ezrAuth: {
        requireAdmin: true,
      },
    },
    handler: async (request, reply) => {
      const doesExists = await templates.doesTemplateExist(request.params.id);
      if (doesExists) {
        await templates.deleteTemplate(request.params.id);
      }

      return responses.buildSuccessResponse({ deleted: doesExists }, reply);
    },
  });
};

export default router;
