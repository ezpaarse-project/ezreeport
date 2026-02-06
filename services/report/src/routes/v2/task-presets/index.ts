import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezreeport/models/lib/zod';
import { calcNextDateFromRecurrence } from '@ezreeport/models/lib/periods';

import authPlugin, { requireAllowedNamespace } from '~/plugins/auth';
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

import { ConflictError, NotFoundError } from '~/models/errors';

const SpecificTaskPresetParams = z.object({
  id: z.string().min(1).describe('ID of the task preset'),
});

// oxlint-disable-next-line max-lines-per-function, require-await
const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(authPlugin);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get all task presets',
      tags: ['task-presets'],
      querystring: z.object({
        ...PaginationQuery.shape,
        ...TaskPresetQueryFilters.shape,
        ...TaskPresetQueryInclude.shape,
      }),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zPaginationResponse(TaskPreset),
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
        access: Access.READ_WRITE,
      },
    },
    preHandler: [
      // Hide hidden preset for non admins
      // oxlint-disable-next-line require-await
      async (request): Promise<void> => {
        if (request.user?.isAdmin) {
          return;
        }
        request.query.hidden = false;
      },
    ],
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      // Extract pagination and filters from query
      const { page, count, sort, order, include, ...filters } = request.query;

      const content = await taskPresets.getAllTaskPresets(filters, include, {
        page,
        count,
        sort,
        order,
      });

      return buildPaginatedResponse(
        content,
        {
          page: request.query.page,
          total: await taskPresets.countTaskPresets(filters),
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
      summary: 'Create task preset',
      tags: ['task-presets'],
      body: InputTaskPreset,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.CREATED]: zSuccessResponse(TaskPreset),
      },
    },
    config: {
      ezrAuth: {
        requireAdmin: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const content = await taskPresets.createTaskPreset(request.body);

      reply.status(StatusCodes.CREATED);
      return buildSuccessResponse(content, reply);
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
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(TaskPreset),
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
        access: Access.READ_WRITE,
      },
    },
    preHandler: [
      // Preset can't be hidden if user is not admin
      async (request): Promise<void> => {
        if (request.user?.isAdmin) {
          return;
        }
        const content = await taskPresets.getTaskPreset(request.params.id);
        if (content?.hidden) {
          throw new NotFoundError(`Task preset ${request.params.id} not found`);
        }
      },
    ],
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      // We already checked the task preset exists in preHandler
      const content = (await taskPresets.getTaskPreset(
        request.params.id,
        request.query.include
      ))!;

      return buildSuccessResponse(content, reply);
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
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(TaskPreset),
      },
    },
    config: {
      ezrAuth: {
        requireAdmin: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const doesExists = await taskPresets.doesTaskPresetExist(
        request.params.id
      );

      let taskPreset;
      if (doesExists) {
        taskPreset = await taskPresets.editTaskPreset(
          request.params.id,
          request.body
        );
      } else {
        taskPreset = await taskPresets.createTaskPreset({
          ...request.body,
          id: request.params.id,
        });
      }

      return buildSuccessResponse(taskPreset, reply);
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
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.NOT_FOUND,
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
      const doesExists = await taskPresets.doesTaskPresetExist(
        request.params.id
      );
      if (doesExists) {
        await taskPresets.deleteTaskPreset(request.params.id);
      }

      return buildSuccessResponse({ deleted: doesExists }, reply);
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
      // Preset can't be hidden if user is not admin
      async (request): Promise<void> => {
        if (request.user?.isAdmin) {
          return;
        }
        const content = await taskPresets.getTaskPreset(request.params.id);
        if (content?.hidden) {
          throw new NotFoundError(`Task preset ${request.params.id} not found`);
        }
      },
      // Check if similar task already exists
      async (request): Promise<void> => {
        // If filters are provided, trust user
        const { filters } = request.body;
        if ((filters?.length ?? 0) > 0) {
          return;
        }

        // We already checked the task preset exists in preHandler
        const { id } = request.params;
        const preset = (await taskPresets.getTaskPreset(id))!;
        // If filters are provided, trust user
        if ((preset.fetchOptions?.filters?.length ?? 0) > 0) {
          return;
        }

        const similarTaskExists = await doesSimilarTaskExist(
          request.body.namespaceId,
          preset.recurrence,
          preset.templateId,
          request.body.index
        );

        if (similarTaskExists) {
          throw new ConflictError('Similar task already exists');
        }
      },
    ],
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      // We already checked the task preset exists in preHandler
      const taskPreset = (await taskPresets.getTaskPreset(request.params.id))!;

      const nextRun = calcNextDateFromRecurrence(
        new Date(),
        taskPreset.recurrence,
        taskPreset.recurrenceOffset
      );

      const task = await createTask({
        name: request.body.name,
        description: request.body.description,
        namespaceId: request.body.namespaceId,
        targets: request.body.targets,
        template: {
          version: 2,
          index: request.body.index,
          dateField: taskPreset.fetchOptions?.dateField,
          filters: request.body.filters || taskPreset.fetchOptions?.filters,
        },
        recurrence: taskPreset.recurrence,
        recurrenceOffset: taskPreset.recurrenceOffset,
        extendedId: taskPreset.templateId,
        nextRun,
        enabled: true,
      });

      return buildSuccessResponse(task, reply);
    },
  });
};

// oxlint-disable-next-line no-default-exports
export default router;
