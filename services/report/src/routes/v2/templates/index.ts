import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezreeport/models/lib/zod';

import config from '~/lib/config';

import { Access } from '~/models/access';
import { NotFoundError } from '~/models/errors';
import { buildPaginatedResponse } from '~/models/pagination';
import {
  PaginationQuery,
  zPaginationResponse,
} from '~/models/pagination/types';
import * as templates from '~/models/templates';
import {
  InputTemplate,
  Template,
  TemplateQueryFilters,
  TemplateQueryInclude,
} from '~/models/templates/types';

import { authPlugin } from '~/plugins/auth';
import {
  buildSuccessResponse,
  describeErrors,
  zSuccessResponse,
} from '~/routes/v2/responses';

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
      summary: 'Get all templates',
      tags: ['templates'],
    },
    config: {
      ezrAuth: {
        access: Access.READ_WRITE,
        requireUser: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      // Extract pagination and filters from query
      const { page, count, sort, order, include, ...filters } = request.query;

      const content = await templates.getAllTemplates(filters, include, {
        count,
        order,
        page,
        sort,
      });

      return buildPaginatedResponse(
        content,
        {
          count: content.length,
          default: config.defaultTemplate.id,
          page: request.query.page,
          total: await templates.countTemplates(filters),
        },
        reply
      );
    },
  });

  fastify.route({
    method: 'POST',
    url: '/',
    schema: {
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
      summary: 'Create template',
      tags: ['templates'],
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
      summary: 'Get specific template',
      tags: ['templates'],
    },
    config: {
      ezrAuth: {
        access: Access.READ,
        requireUser: true,
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
      body: InputTemplate,
      params: SpecificTemplateParams,
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
      summary: 'Upsert specific template',
      tags: ['templates'],
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
      summary: 'Delete specific template',
      tags: ['templates'],
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
