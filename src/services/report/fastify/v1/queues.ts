import type { FastifyPluginAsync } from 'fastify';

import { StatusCodes } from 'http-status-codes';
import authPlugin from '~/fastify/plugins/auth';

import * as queues from '~/lib/bull';
import { Type, type Static } from '~/lib/typebox';
import { PaginationQuery, type PaginationQueryType } from '../utils/pagination';
import { Access } from '~/.prisma/client';
import { HTTPError, NotFoundError } from '~/types/errors';

const router: FastifyPluginAsync = async (fastify) => {
  await fastify.register(authPlugin, { prefix: 'queues' });

  /**
   * Get all possible queues
   */
  fastify.get(
    '/',
    {
      config: {
        auth: {
          requireAdmin: true,
        },
      },
    },
    async () => ({
      content: await queues.getQueues(),
    }),
  );

  const SpecificQueueParams = Type.Object({
    queue: Type.String({ minLength: 1 }),
  });
  type SpecificQueueParamsType = Static<typeof SpecificQueueParams>;

  /**
   * Pause specific queue
   */
  fastify.put<{
    Params: SpecificQueueParamsType
  }>(
    '/:queue/pause',
    {
      schema: {
        params: SpecificQueueParams,
      },
      config: {
        auth: {
          requireAdmin: true,
        },
      },
    },
    async (request) => {
      const { queue: name } = request.params;
      await queues.pauseQueue(name);

      return (await queues.getQueues()).find((q) => q.name === name);
    },
  );

  /**
   * Resume specific queue
   */
  fastify.put<{
    Params: SpecificQueueParamsType
  }>(
    '/:queue/resume',
    {
      schema: {
        params: SpecificQueueParams,
      },
      config: {
        auth: {
          requireAdmin: true,
        },
      },
    },
    async (request) => {
      const { queue: name } = request.params;
      await queues.resumeQueue(name);

      return (await queues.getQueues()).find((q) => q.name === name);
    },
  );

  /**
   * Get jobs of a specific queue
   */
  fastify.get<{
    Params: SpecificQueueParamsType,
    Querystring: PaginationQueryType,
  }>(
    '/:queue/jobs',
    {
      schema: {
        params: SpecificQueueParams,
        querystring: PaginationQuery,
      },
      config: {
        auth: {
          requireAdmin: true,
        },
      },
    },
    async (request) => {
      const { queue: name } = request.params;
      const { previous: p = undefined, count = 15 } = request.query;

      // TODO: custom sort
      const jobs = await queues.getJobs(
        name,
        {
          count,
          previous: p?.toString(),
        },
      );

      return {
        data: jobs,
        meta: {
          total: await queues.getCountJobs(name),
          count: jobs.length,
          size: count,
          lastId: jobs.at(-1)?.id,
        },
      };
    },
  );

  const SpecificJobParams = Type.Intersect([
    SpecificQueueParams,
    Type.Object({
      jobId: Type.String({ minLength: 1 }),
    }),
  ]);
  type SpecificJobParamsType = Static<typeof SpecificJobParams>;

  /**
   * Get specific job info
   *
   * Can't access to other namespace's jobs
   */
  fastify.get<{
    Params: SpecificJobParamsType
  }>(
    '/:queue/jobs/:jobId',
    {
      schema: {
        params: SpecificJobParams,
      },
      config: {
        auth: {
          access: Access.READ,
        },
      },
    },
    async (request) => {
      const { queue: name, jobId } = request.params;
      const job = await queues.getJob(name, jobId);
      if (!job) {
        throw new NotFoundError(`Job "${jobId}" not found`);
      }

      const namespaceId = 'file' in job.data ? job.data.task.namespace : job.data.task.namespaceId;
      if (!request.namespaceIds?.includes(namespaceId)) {
        throw new HTTPError(`Job "${jobId}" doesn't match your namespaces`, StatusCodes.FORBIDDEN);
      }

      return job;
    },
  );

  /**
   * Retry specific job
   *
   * Can't access to other namespace's jobs
   *
   * Throw an error if job wasn't failed
   */
  fastify.post<{
    Params: SpecificJobParamsType
  }>(
    '/:queue/jobs/:jobId/retry',
    {
      schema: {
        params: SpecificJobParams,
      },
      config: {
        auth: {
          access: Access.READ_WRITE,
        },
      },
    },
    async (request) => {
      const { queue: name, jobId } = request.params;
      const job = await queues.getJob(name, jobId);
      if (!job) {
        throw new NotFoundError(`Job "${jobId}" not found`);
      }

      const namespaceId = 'file' in job.data ? job.data.task.namespace : job.data.task.namespaceId;
      if (!request.namespaceIds?.includes(namespaceId)) {
        throw new HTTPError(`Job "${jobId}" doesn't match your namespaces`, StatusCodes.FORBIDDEN);
      }

      return queues.retryJob(name, jobId);
    },
  );
};

export default router;
