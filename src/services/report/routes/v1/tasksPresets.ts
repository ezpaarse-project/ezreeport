import type { FastifyPluginAsync } from 'fastify';
import { StatusCodes } from 'http-status-codes';

import authPlugin from '~/plugins/auth';

import { Type, type Static } from '~/lib/typebox';

import * as tasksPresets from '~/models/tasksPresets';

const router: FastifyPluginAsync = async (fastify) => {
  await fastify.register(authPlugin, { prefix: 'tasks-preset' });

  /**
   * List all presets
   */
  fastify.get(
    '/',
    {
      ezrAuth: {
        requireUser: true,
      },
    },
    async () => ({
      content: await tasksPresets.getAllTasksPresets(),
    }),
  );

  /**
   * Create preset
   */
  fastify.post<{
    Body: tasksPresets.TasksPresetType,
  }>(
    '/',
    {
      schema: {
        body: tasksPresets.TasksPreset,
      },
      ezrAuth: {
        requireAdmin: true,
      },
    },
    async (request, reply) => {
      reply.status(StatusCodes.CREATED);
      return {
        content: await tasksPresets.createTasksPreset(request.body),
      };
    },
  );

  const SpecificPresetParams = Type.Object({
    preset: Type.String({ minLength: 1 }),
  });
  type SpecificPresetParamsType = Static<typeof SpecificPresetParams>;

  /**
   * Get specific preset
   */
  fastify.get<{
    Params: SpecificPresetParamsType
  }>(
    '/:preset',
    {
      schema: {
        params: SpecificPresetParams,
      },
      ezrAuth: {
        requireUser: true,
      },
    },
    async (request) => {
      const { preset: id } = request.params;

      const item = await tasksPresets.getTasksPresetById(id);
      if (!item) {
        throw new Error(`No preset named "${id}" was found`);
      }

      return { content: item };
    },
  );

  /**
   * Edit or create preset
   */
  fastify.put<{
    Params: SpecificPresetParamsType,
    Body: tasksPresets.TasksPresetType,
  }>(
    '/:preset',
    {
      schema: {
        params: SpecificPresetParams,
        body: tasksPresets.TasksPreset,
      },
      ezrAuth: {
        requireAdmin: true,
      },
    },
    async (request, reply) => {
      const { preset: id } = request.params;

      const item = await tasksPresets.getTasksPresetById(id);
      if (!item) {
        reply.status(StatusCodes.CREATED);
        return {
          content: await tasksPresets.createTasksPreset(request.body, id),
        };
      }

      return {
        content: await tasksPresets.editTasksPresetById(
          id,
          request.body,
        ),
      };
    },
  );

  /**
   * Delete preset
   */
  fastify.delete<{
    Params: SpecificPresetParamsType
  }>(
    '/:preset',
    {
      schema: {
        params: SpecificPresetParams,
      },
      ezrAuth: {
        requireAdmin: true,
      },
    },
    async (request) => {
      const { preset: id } = request.params;

      await tasksPresets.deleteTasksPresetById(id);
    },
  );
};

export default router;
