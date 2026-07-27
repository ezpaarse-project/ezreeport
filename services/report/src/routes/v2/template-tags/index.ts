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
import * as templateTags from '~/models/template-tags';
import {
  InputTemplateTag,
  TemplateTagQueryFilters,
} from '~/models/template-tags/types';
import { TemplateTag } from '~/models/templates/types';

import { authPlugin } from '~/plugins/auth';
import {
  buildSuccessResponse,
  describeErrors,
  zSuccessResponse,
} from '~/routes/v2/responses';

const SpecificTemplateTagParams = z.object({
  id: z.string().min(1).describe('ID of the tag'),
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
        ...TemplateTagQueryFilters.shape,
      }),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zPaginationResponse(TemplateTag),
      },
      summary: 'Get all template tags',
      tags: ['template-tags'],
    },
    config: {
      ezrAuth: {
        access: Access.READ,
        requireUser: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      // Extract pagination and filters from query
      const { page, count, sort, order, ...filters } = request.query;

      const content = await templateTags.getAllTemplateTags(filters, {
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
          total: await templateTags.countTemplateTags(filters),
        },
        reply
      );
    },
  });

  fastify.route({
    method: 'POST',
    url: '/',
    schema: {
      body: InputTemplateTag,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.CREATED]: zSuccessResponse(TemplateTag),
      },
      summary: 'Create template tag',
      tags: ['template-tags'],
    },
    config: {
      ezrAuth: {
        requireAdmin: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const content = await templateTags.createTemplateTag(request.body);

      reply.status(StatusCodes.CREATED);
      return buildSuccessResponse(content, reply);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: {
      params: SpecificTemplateTagParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(TemplateTag),
      },
      summary: 'Get specific template tag',
      tags: ['template-tags'],
    },
    config: {
      ezrAuth: {
        access: Access.READ,
        requireUser: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const content = await templateTags.getTemplateTag(request.params.id);

      if (!content) {
        throw new NotFoundError(`Template tag ${request.params.id} not found`);
      }

      return buildSuccessResponse(content, reply);
    },
  });

  fastify.route({
    method: 'PUT',
    url: '/:id',
    schema: {
      body: InputTemplateTag,
      params: SpecificTemplateTagParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(TemplateTag),
      },
      summary: 'Upsert specific template tag',
      tags: ['template-tags'],
    },
    config: {
      ezrAuth: {
        requireAdmin: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const doesExists = await templateTags.doesTemplateTagExist(
        request.params.id
      );

      let template;
      if (doesExists) {
        template = await templateTags.editTemplateTag(
          request.params.id,
          request.body
        );
      } else {
        template = await templateTags.createTemplateTag({
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
      params: SpecificTemplateTagParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(z.object({ deleted: z.boolean() })),
      },
      summary: 'Delete specific template tag',
      tags: ['template-tags'],
    },
    config: {
      ezrAuth: {
        requireAdmin: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const doesExists = await templateTags.doesTemplateTagExist(
        request.params.id
      );
      if (doesExists) {
        await templateTags.deleteTemplateTag(request.params.id);
      }

      return buildSuccessResponse({ deleted: doesExists }, reply);
    },
  });
};

// oxlint-disable-next-line no-default-export
export default router;
