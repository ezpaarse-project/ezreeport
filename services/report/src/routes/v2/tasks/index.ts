import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezreeport/models/lib/zod';

import authPlugin, {
  requireAllowedNamespace,
  restrictNamespaces,
} from '~/plugins/auth';
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

import * as tasks from '~/models/tasks';
import {
  Task,
  InputTask,
  TaskQueryFilters,
  TaskQueryInclude,
} from '~/models/tasks/types';
import { createActivity } from '~/models/task-activity';

import { ConflictError, NotFoundError } from '~/models/errors';

const SpecificTaskParams = z.object({
  id: z.string().min(1).describe('ID of the task'),
});

// oxlint-disable-next-line max-lines-per-function, require-await
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
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zPaginationResponse(Task.omit({ template: true })),
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
        access: Access.READ,
      },
    },
    preHandler: [
      async (request): Promise<void> => {
        const restrictedIds = await restrictNamespaces(
          request,
          request.query.namespaceId
        );
        request.query.namespaceId = restrictedIds;
      },
    ],
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      // Extract pagination and filters from query
      const { page, count, sort, order, include, ...filters } = request.query;

      const content = await tasks.getAllTasks(filters, include, {
        page,
        count,
        sort,
        order,
      });

      return buildPaginatedResponse(
        content,
        {
          page,
          total: await tasks.countTasks(filters),
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
      summary: 'Create task',
      tags: ['tasks'],
      body: InputTask,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.CONFLICT,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.CREATED]: zSuccessResponse(Task),
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
        access: Access.READ_WRITE,
      },
    },
    preHandler: [
      (request): Promise<void> =>
        requireAllowedNamespace(request, request.body.namespaceId),
      // Check if similar task already exists
      async (request): Promise<void> => {
        // If filters are provided, trust user
        if (request.body.template.filters || (request.body.template.inserts?.length ?? 0) > 0) {
          return;
        }

        const similarTaskExists = await tasks.doesSimilarTaskExist(
          request.body.namespaceId,
          request.body.recurrence,
          request.body.extendedId,
          request.body.template.index
        );

        if (similarTaskExists) {
          throw new ConflictError('Similar task already exists');
        }
      },
    ],
    // oxlint-disable-next-line require-await
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
      return buildSuccessResponse(content, reply);
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
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(Task),
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
      const content = await tasks.getTask(
        request.params.id,
        request.query.include
      );

      if (!content) {
        throw new NotFoundError(`Task ${request.params.id} not found`);
      }

      return buildSuccessResponse(content, reply);
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
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(Task),
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
        access: Access.READ_WRITE,
      },
    },
    preHandler: [
      (request): Promise<void> =>
        requireAllowedNamespace(request, request.body.namespaceId),
      async (request) => {
        const task = await tasks.getTask(request.params.id);
        return requireAllowedNamespace(request, task?.namespaceId ?? '');
      },
    ],
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const doesTaskExists = await tasks.doesTaskExist(request.params.id);

      const { username = 'unknown' } = request.user ?? {};

      let task;
      let activity;
      if (doesTaskExists) {
        task = await tasks.editTask(request.params.id, request.body);
        activity = {
          type: 'edition',
          message: `Tâche modifiée par ${username}`,
        };
      } else {
        task = await tasks.createTask({
          ...request.body,
          id: request.params.id,
        });
        activity = { type: 'creation', message: `Tâche crée par ${username}` };
      }

      await createActivity({
        ...activity,
        taskId: task.id,
        data: { user: username },
      });

      return buildSuccessResponse(task, reply);
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
        requireUser: true,
        access: Access.READ_WRITE,
      },
    },
    preHandler: [
      async (request): Promise<void> => {
        const task = await tasks.getTask(request.params.id);
        return requireAllowedNamespace(request, task?.namespaceId ?? '');
      },
    ],
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const doesTaskExists = await tasks.doesTaskExist(request.params.id);
      if (doesTaskExists) {
        await tasks.deleteTask(request.params.id);
      }

      return buildSuccessResponse({ deleted: !!doesTaskExists }, reply);
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
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(Task),
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
        access: Access.READ_WRITE,
      },
    },
    preHandler: [
      async (request): Promise<void> => {
        const task = await tasks.getTask(request.params.id);
        return requireAllowedNamespace(request, task?.namespaceId ?? '');
      },
    ],
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const doesTaskExists = await tasks.doesTaskExist(request.params.id);
      if (!doesTaskExists) {
        throw new NotFoundError(`Task ${request.params.id} not found`);
      }

      const { username = 'unknown' } = request.user ?? {};
      const activity = {
        type: 'edition',
        message: `Tâche déliée par ${username}`,
      };

      const task = await tasks.unlinkTaskFromTemplate(request.params.id);

      await createActivity({
        ...activity,
        taskId: task.id,
        data: { user: username },
      });

      return buildSuccessResponse(task, reply);
    },
  });
};

// oxlint-disable-next-line no-default-exports
export default router;
