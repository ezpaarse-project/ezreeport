import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { startOfDay } from '~common/lib/date-fns';
import { z } from '~common/lib/zod';

import authPlugin, { requireAllowedNamespace } from '~/plugins/auth';
import { Access } from '~/models/access';

import * as responses from '~/routes/v2/responses';
import { buildPaginatedResponse } from '~/models/pagination';
import { PaginationQuery, PaginationResponse } from '~/models/pagination/types';

import * as taskPresets from '~/models/task-presets';
import {
  TaskPreset,
  InputTaskPreset,
  TaskPresetQueryFilters,
  AdditionalDataForPreset,
  TaskPresetQueryInclude,
} from '~/models/task-presets/types';
import { createTask, doesSimilarTaskExist } from '~/models/tasks';
import { Task } from '~/models/tasks/types';
import { calcPeriodFromRecurrence } from '~/models/recurrence';

import { ConflictError, NotFoundError } from '~/models/errors';

const SpecificTaskPresetParams = z.object({
  id: z.string().min(1)
    .describe('ID of the task preset'),
});

const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(authPlugin);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get all task presets',
      tags: ['task-presets'],
      querystring: PaginationQuery.and(TaskPresetQueryFilters).and(TaskPresetQueryInclude),
      response: {
        [StatusCodes.OK]: PaginationResponse(TaskPreset),
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
      async (request) => { // restrictHidden
        if (request.user?.isAdmin) { return; }
        request.query.hidden = false;
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

      const content = await taskPresets.getAllTaskPresets(
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
          page: request.query.page,
          total: await taskPresets.countTaskPresets(filters),
        },
        reply,
      );
    },
  });

  fastify.route({
    method: 'POST',
    url: '/',
    schema: {
      summary: 'Create task preset',
      tags: ['task-presets'],
      body: InputTaskPreset,
      response: {
        [StatusCodes.CREATED]: responses.SuccessResponse(TaskPreset),
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
      const content = await taskPresets.createTaskPreset(request.body);

      reply.status(StatusCodes.CREATED);
      return responses.buildSuccessResponse(content, reply);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: {
      summary: 'Get specific task preset',
      tags: ['task-presets'],
      params: SpecificTaskPresetParams,
      querystring: TaskPresetQueryInclude,
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(TaskPreset),
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
        access: Access.READ_WRITE,
      },
    },
    preHandler: [
      async (request) => { // requireNotHidden
        if (request.user?.isAdmin) { return; }
        const content = await taskPresets.getTaskPreset(request.params.id);
        if (content?.hidden) { throw new NotFoundError(`Task preset ${request.params.id} not found`); }
      },
    ],
    handler: async (request, reply) => {
      // We already checked the task preset exists in preHandler
      const content = (await taskPresets.getTaskPreset(request.params.id, request.query.include))!;

      return responses.buildSuccessResponse(content, reply);
    },
  });

  fastify.route({
    method: 'PUT',
    url: '/:id',
    schema: {
      summary: 'Upsert specific task preset',
      tags: ['task-presets'],
      params: SpecificTaskPresetParams,
      body: InputTaskPreset,
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(TaskPreset),
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
      const doesExists = await taskPresets.doesTaskPresetExist(request.params.id);

      let taskPreset;
      if (doesExists) {
        taskPreset = await taskPresets.editTaskPreset(request.params.id, request.body);
      } else {
        taskPreset = await taskPresets.createTaskPreset({ ...request.body, id: request.params.id });
      }

      return responses.buildSuccessResponse(taskPreset, reply);
    },
  });

  fastify.route({
    method: 'DELETE',
    url: '/:id',
    schema: {
      summary: 'Delete specific task preset',
      tags: ['task-presets'],
      params: SpecificTaskPresetParams,
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
      const doesExists = await taskPresets.doesTaskPresetExist(request.params.id);
      if (doesExists) {
        await taskPresets.deleteTaskPreset(request.params.id);
      }

      return responses.buildSuccessResponse({ deleted: doesExists }, reply);
    },
  });

  fastify.route({
    method: 'POST',
    url: '/:id/tasks',
    schema: {
      summary: 'Create task from task preset',
      tags: ['task-presets', 'tasks'],
      params: SpecificTaskPresetParams,
      body: AdditionalDataForPreset,
      response: {
        ...responses.describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.CONFLICT,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.CREATED]: responses.SuccessResponse(Task),
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
      async (request) => { // requireNotHidden
        if (request.user?.isAdmin) { return; }
        const content = await taskPresets.getTaskPreset(request.params.id);
        if (content?.hidden) { throw new NotFoundError(`Task preset ${request.params.id} not found`); }
      },
      // Check if similar task already exists
      async (request) => {
        // If filters are provided, trust user
        if (request.body.filters) {
          return;
        }

        // We already checked the task preset exists in preHandler
        const taskPreset = (await taskPresets.getTaskPreset(request.params.id))!;
        const similarTaskExists = await doesSimilarTaskExist(
          request.body.namespaceId,
          taskPreset.recurrence,
          taskPreset.templateId,
          request.body.index,
        );

        if (similarTaskExists) {
          throw new ConflictError('Similar task already exists');
        }
      },
    ],
    handler: async (request, reply) => {
      // We already checked the task preset exists in preHandler
      const taskPreset = (await taskPresets.getTaskPreset(request.params.id))!;

      // Set next run to start of recurrence (start of week for weekly, etc.)
      const currentPeriod = calcPeriodFromRecurrence(new Date(), taskPreset.recurrence, 1);
      const nextRun = startOfDay(currentPeriod.start);

      const task = await createTask({
        name: request.body.name,
        description: request.body.description,
        namespaceId: request.body.namespaceId,
        targets: request.body.targets,
        template: {
          version: 2,
          index: request.body.index,
          dateField: taskPreset.fetchOptions?.dateField,
          filters: request.body.filters,
        },
        recurrence: taskPreset.recurrence,
        extendedId: taskPreset.templateId,
        nextRun,
        enabled: true,
      });

      return responses.buildSuccessResponse(task, reply);
    },
  });
};

export default router;
