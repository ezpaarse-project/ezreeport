import type { FastifyPluginAsync } from 'fastify';

import authPlugin from '~/plugins/auth';

import * as crons from '~/lib/cron';
import { Type, type Static } from '~/lib/typebox';

const router: FastifyPluginAsync = async (fastify) => {
  await fastify.register(authPlugin, { prefix: 'crons' });

  /**
   * List all crons
   */
  fastify.get(
    '/',
    {
      ezrAuth: {
        requireAdmin: true,
      },
    },
    async () => ({
      content: await crons.getAllCrons(),
    }),
  );

  const SpecificCronParams = Type.Object({
    cron: Type.String({ minLength: 1 }),
  });
  type SpecificCronParamsType = Static<typeof SpecificCronParams>;

  /**
   * Get info about specific cron
   */
  fastify.get<{
    Params: SpecificCronParamsType
  }>(
    '/:cron',
    {
      schema: {
        params: SpecificCronParams,
      },
      ezrAuth: {
        requireAdmin: true,
      },
    },
    async (request) => {
      const { cron: name } = request.params;
      return { content: await crons.getCron(name) };
    },
  );

  /**
   * Start specific cron
   */
  fastify.put<{
    Params: SpecificCronParamsType
  }>(
    '/:cron/start',
    {
      schema: {
        params: SpecificCronParams,
      },
      ezrAuth: {
        requireAdmin: true,
      },
    },
    async (request) => {
      const { cron: name } = request.params;
      return { content: await crons.startCron(name) };
    },
  );

  /**
   * Stop specific cron
   */
  fastify.put<{
    Params: SpecificCronParamsType
  }>(
    '/:cron/stop',
    {
      schema: {
        params: SpecificCronParams,
      },
      ezrAuth: {
        requireAdmin: true,
      },
    },
    async (request) => {
      const { cron: name } = request.params;
      return { content: await crons.stopCron(name) };
    },
  );

  /**
   * Force a specific cron to run
   */
  fastify.post<{
    Params: SpecificCronParamsType
  }>(
    '/:cron/force',
    {
      schema: {
        params: SpecificCronParams,
      },
      ezrAuth: {
        requireAdmin: true,
      },
    },
    async (request) => {
      const { cron: name } = request.params;
      return { content: await crons.forceCron(name) };
    },
  );
};

export default router;
