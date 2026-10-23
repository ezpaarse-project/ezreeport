import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezreeport/models/lib/zod';

import { Access } from '~/models/access';
import { ConflictError, NotFoundError } from '~/models/errors';
import { buildPaginatedResponse } from '~/models/pagination';
import {
  PaginationQuery,
  zPaginationResponse,
} from '~/models/pagination/types';
import { createActivity } from '~/models/task-activity';
import * as tasks from '~/models/tasks';
import {
  InputTask,
  Task,
  TaskQueryFilters,
  TaskQueryInclude,
} from '~/models/tasks/types';

import {
  authPlugin,
  requireAllowedNamespace,
  restrictNamespaces,
} from '~/plugins/auth';
import {
  buildSuccessResponse,
  describeErrors,
  zSuccessResponse,
} from '~/routes/v2/responses';

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
      querystring: z.object({
        ...PaginationQuery.shape,
        ...TaskQueryFilters.shape,
        ...TaskQueryInclude.shape,
      }),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zPaginationResponse(Task.omit({ template: true })),
      },
      summary: 'Get all tasks',
      tags: ['tasks'],
    },
    config: {
      ezrAuth: {
        access: Access.READ,
        requireUser: true,
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
        count,
        order,
        page,
        sort,
      });

      return buildPaginatedResponse(
        content,
        {
          count: content.length,
          page,
          total: await tasks.countTasks(filters),
        },
        reply
      );
    },
  });

  fastify.route({
    method: 'POST',
    url: '/',
    schema: {
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
      summary: 'Create task',
      tags: ['tasks'],
    },
    config: {
      ezrAuth: {
        access: Access.READ_WRITE,
        requireUser: true,
      },
    },
    preHandler: [
      (request): Promise<void> =>
        requireAllowedNamespace(request, request.body.namespaceId),
      // Check if similar task already exists
      async (request): Promise<void> => {
        // If filters are provided, trust user
        const { filters, inserts } = request.body.template;
        if ((filters?.length ?? 0) > 0 || (inserts?.length ?? 0) > 0) {
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
        data: { user: username },
        message: `Tâche crée par ${username}`,
        taskId: content.id,
        type: 'creation',
      });

      reply.status(StatusCodes.CREATED);
      return buildSuccessResponse(content, reply);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: {
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
      summary: 'Get specific task',
      tags: ['tasks'],
    },
    config: {
      ezrAuth: {
        access: Access.READ,
        requireUser: true,
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
      body: InputTask,
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
      summary: 'Upsert specific task',
      tags: ['tasks'],
    },
    config: {
      ezrAuth: {
        access: Access.READ_WRITE,
        requireUser: true,
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
          message: `Tâche modifiée par ${username}`,
          type: 'edition',
        };
      } else {
        task = await tasks.createTask({
          ...request.body,
          id: request.params.id,
        });
        activity = { message: `Tâche crée par ${username}`, type: 'creation' };
      }

      await createActivity({
        ...activity,
        data: { user: username },
        taskId: task.id,
      });

      return buildSuccessResponse(task, reply);
    },
  });

  fastify.route({
    method: 'DELETE',
    url: '/:id',
    schema: {
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
      summary: 'Delete specific task',
      tags: ['tasks'],
    },
    config: {
      ezrAuth: {
        access: Access.READ_WRITE,
        requireUser: true,
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

      return buildSuccessResponse({ deleted: Boolean(doesTaskExists) }, reply);
    },
  });

  fastify.route({
    method: 'DELETE',
    url: '/:id/extended',
    schema: {
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
      summary: 'Delete link between task and template',
      tags: ['tasks'],
    },
    config: {
      ezrAuth: {
        access: Access.READ_WRITE,
        requireUser: true,
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
        message: `Tâche déliée par ${username}`,
        type: 'edition',
      };

      const task = await tasks.unlinkTaskFromTemplate(request.params.id);

      await createActivity({
        ...activity,
        data: { user: username },
        taskId: task.id,
      });

      return buildSuccessResponse(task, reply);
    },
  });
};

// oxlint-disable-next-line no-default-export
export default router;
