import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '~common/lib/zod';

import authPlugin, { requireAllowedNamespace, restrictNamespaces } from '~/plugins/auth';
import { Access } from '~/models/access';

import * as responses from '~/routes/v2/responses';
import { buildPaginatedResponse } from '~/models/pagination';
import { PaginationQuery, PaginationResponse } from '~/models/pagination/types';

import * as tasks from '~/models/tasks';
import {
  Task,
  InputTask,
  TaskQueryFilters,
  TaskQueryInclude,
} from '~/models/tasks/types';
import { createActivity } from '~/models/task-activity';

import { NotFoundError } from '~/types/errors';

const SpecificTaskParams = z.object({
  id: z.string().min(1)
    .describe('ID of the task'),
});

const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(authPlugin);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get all tasks',
      tags: ['tasks'],
      querystring: PaginationQuery.and(TaskQueryFilters).and(TaskQueryInclude),
      response: {
        [StatusCodes.OK]: PaginationResponse(
          Task.omit({ template: true }),
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
        access: Access.READ,
      },
    },
    preHandler: [
      async (request) => {
        const restrictedIds = await restrictNamespaces(request, request.query.namespaceId);
        request.query.namespaceId = restrictedIds;
      },
    ],
    handler: async (request, reply) => {
      // Extract pagination and filters from query
      const {
        page,
        count,
        sort,
        order,
        include,
        ...filters
      } = request.query;

      const content = await tasks.getAllTasks(
        filters,
        include,
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
          page,
          total: await tasks.countTasks(filters),
        },
        reply,
      );
    },
  });

  fastify.route({
    method: 'POST',
    url: '/',
    schema: {
      summary: 'Create task',
      tags: ['tasks'],
      body: InputTask,
      response: {
        [StatusCodes.CREATED]: responses.SuccessResponse(Task),
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
    preHandler: [
      async (request) => requireAllowedNamespace(request, request.body.namespaceId),
    ],
    handler: async (request, reply) => {
      const content = await tasks.createTask(request.body);

      const { username = 'unknown' } = request.user ?? {};
      await createActivity({
        type: 'creation',
        message: `Tâche crée par ${username}`,
        taskId: content.id,
        data: { user: username },
      });

      reply.status(StatusCodes.CREATED);
      return responses.buildSuccessResponse(content, reply);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: {
      summary: 'Get specific task',
      tags: ['tasks'],
      params: SpecificTaskParams,
      querystring: TaskQueryInclude,
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(Task),
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
      const content = await tasks.getTask(request.params.id, request.query.include);

      if (!content) {
        throw new NotFoundError(`Task ${request.params.id} not found`);
      }

      return responses.buildSuccessResponse(content, reply);
    },
  });

  fastify.route({
    method: 'PUT',
    url: '/:id',
    schema: {
      summary: 'Upsert specific task',
      tags: ['tasks'],
      params: SpecificTaskParams,
      body: InputTask,
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(Task),
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
    preHandler: [
      async (request) => requireAllowedNamespace(request, request.body.namespaceId),
      async (request) => {
        const task = await tasks.getTask(request.params.id);
        return requireAllowedNamespace(request, task?.namespaceId ?? '');
      },
    ],
    handler: async (request, reply) => {
      const doesTaskExists = await tasks.doesTaskExist(request.params.id);

      const { username = 'unknown' } = request.user ?? {};

      let task;
      let activity;
      if (doesTaskExists) {
        task = await tasks.editTask(request.params.id, request.body);
        activity = { type: 'edition', message: `Tâche modifiée par ${username}` };
      } else {
        task = await tasks.createTask({ ...request.body, id: request.params.id });
        activity = { type: 'creation', message: `Tâche crée par ${username}` };
      }

      await createActivity({
        ...activity,
        taskId: task.id,
        data: { user: username },
      });

      return responses.buildSuccessResponse(task, reply);
    },
  });

  fastify.route({
    method: 'DELETE',
    url: '/:id',
    schema: {
      summary: 'Delete specific task',
      tags: ['tasks'],
      params: SpecificTaskParams,
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
        requireUser: true,
        access: Access.READ_WRITE,
      },
    },
    preHandler: [
      async (request) => {
        const task = await tasks.getTask(request.params.id);
        return requireAllowedNamespace(request, task?.namespaceId ?? '');
      },
    ],
    handler: async (request, reply) => {
      const doesTaskExists = await tasks.doesTaskExist(request.params.id);
      if (doesTaskExists) {
        await tasks.deleteTask(request.params.id);
      }

      return responses.buildSuccessResponse({ deleted: !!doesTaskExists }, reply);
    },
  });

  fastify.route({
    method: 'DELETE',
    url: '/:id/extended',
    schema: {
      summary: 'Delete link between task and template',
      tags: ['tasks'],
      params: SpecificTaskParams,
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(Task),
        [StatusCodes.BAD_REQUEST]: responses.schemas[StatusCodes.BAD_REQUEST],
        [StatusCodes.UNAUTHORIZED]: responses.schemas[StatusCodes.UNAUTHORIZED],
        [StatusCodes.FORBIDDEN]: responses.schemas[StatusCodes.FORBIDDEN],
        [StatusCodes.CONFLICT]: responses.schemas[StatusCodes.CONFLICT],
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
        access: Access.READ_WRITE,
      },
    },
    preHandler: [
      async (request) => {
        const task = await tasks.getTask(request.params.id);
        return requireAllowedNamespace(request, task?.namespaceId ?? '');
      },
    ],
    handler: async (request, reply) => {
      const doesTaskExists = await tasks.doesTaskExist(request.params.id);
      if (!doesTaskExists) {
        throw new NotFoundError(`Task ${request.params.id} not found`);
      }

      const { username = 'unknown' } = request.user ?? {};
      const activity = { type: 'edition', message: `Tâche déliée par ${origin}` };

      const task = await tasks.unlinkTaskFromTemplate(request.params.id);

      await createActivity({
        ...activity,
        taskId: task.id,
        data: { user: username },
      });

      return responses.buildSuccessResponse(task, reply);
    },
  });
};

export default router;
