import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezreeport/models/lib/zod';
import config from '~/lib/config';

import authPlugin from '~/plugins/auth';
import { Access } from '~/models/access';

import {
  describeErrors,
  buildSuccessResponse,
  zSuccessResponse,
} from '~/routes/v2/responses';

import { buildPaginatedResponse } from '~/models/pagination';
import {
  PaginationQuery,
  zPaginationResponse,
} from '~/models/pagination/types';

import * as templates from '~/models/templates';
import {
  Template,
  InputTemplate,
  TemplateQueryFilters,
  TemplateQueryInclude,
} from '~/models/templates/types';

import { NotFoundError } from '~/models/errors';

const SpecificTemplateParams = z.object({
  id: z.string().min(1).describe('ID of the template'),
});

// oxlint-disable-next-line max-lines-per-function, require-await
const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(authPlugin);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get all templates',
      tags: ['templates'],
      querystring: z.object({
        ...PaginationQuery.shape,
        ...TemplateQueryFilters.shape,
        ...TemplateQueryInclude.shape,
      }),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zPaginationResponse(
          Template.omit({ body: true }),
          z.object({ default: z.string() })
        ),
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
        access: Access.READ_WRITE,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      // Extract pagination and filters from query
      const { page, count, sort, order, include, ...filters } = request.query;

      const content = await templates.getAllTemplates(filters, include, {
        page,
        count,
        sort,
        order,
      });

      return buildPaginatedResponse(
        content,
        {
          default: config.defaultTemplate.id,
          page: request.query.page,
          total: await templates.countTemplates(filters),
          count: content.length,
        },
        reply
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
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.CREATED]: zSuccessResponse(Template),
      },
    },
    config: {
      ezrAuth: {
        requireAdmin: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const content = await templates.createTemplate(request.body);

      reply.status(StatusCodes.CREATED);
      return buildSuccessResponse(content, reply);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: {
      summary: 'Get specific template',
      tags: ['templates'],
      params: SpecificTemplateParams,
      querystring: TemplateQueryInclude,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(Template),
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
        access: Access.READ,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const content = await templates.getTemplate(
        request.params.id,
        request.query.include
      );

      if (!content) {
        throw new NotFoundError(`Template ${request.params.id} not found`);
      }

      return buildSuccessResponse(content, reply);
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
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(Template),
      },
    },
    config: {
      ezrAuth: {
        requireAdmin: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const doesExists = await templates.doesTemplateExist(request.params.id);

      let template;
      if (doesExists) {
        template = await templates.editTemplate(
          request.params.id,
          request.body
        );
      } else {
        template = await templates.createTemplate({
          ...request.body,
          id: request.params.id,
        });
      }

      return buildSuccessResponse(template, reply);
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
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(z.object({ deleted: z.boolean() })),
      },
    },
    config: {
      ezrAuth: {
        requireAdmin: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const doesExists = await templates.doesTemplateExist(request.params.id);
      if (doesExists) {
        await templates.deleteTemplate(request.params.id);
      }

      return buildSuccessResponse({ deleted: doesExists }, reply);
    },
  });
};

// oxlint-disable-next-line no-default-export
export default router;
