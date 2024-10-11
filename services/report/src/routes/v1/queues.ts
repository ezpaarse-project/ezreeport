import type { FastifyPluginAsync } from 'fastify';

import { StatusCodes } from 'http-status-codes';
import authPlugin from '~/plugins/auth';

import { Access } from '~/models/access';
import * as queues from '~/lib/bull';
import { Type, type Static } from '~/lib/typebox';
import { HTTPError, NotFoundError } from '~/types/errors';

const router: FastifyPluginAsync = async (fastify) => {
  await fastify.register(authPlugin, { prefix: 'queues' });

  /**
   * Get all possible queues
   */
  fastify.get(
    '/',
    {
      ezrAuth: {
        requireAdmin: true,
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
   * Get specific queue
   */
  fastify.get<{
    Params: SpecificQueueParamsType
  }>(
    '/:queue',
    {
      schema: {
        params: SpecificQueueParams,
      },
      ezrAuth: {
        requireAdmin: true,
      },
    },
    async (request) => {
      const { queue: name } = request.params;

      const item = (await queues.getQueues()).find((q) => q.name === name);
      if (!item) {
        throw new NotFoundError(`Queue '${name}' not found`);
      }

      return { content: item };
    },
  );

  /**
   * Update specific queue
   */
  const UpdateQueueBody = Type.Partial(
    Type.Object({
      status: Type.Union([
        Type.Literal('active'),
        Type.Literal('paused'),
      ]),
    }),
  );
  fastify.patch<{
    Params: SpecificQueueParamsType,
    Body: Static<typeof UpdateQueueBody>,
  }>(
    '/:queue',
    {
      schema: {
        params: SpecificQueueParams,
        body: UpdateQueueBody,
      },
      ezrAuth: {
        requireAdmin: true,
      },
    },
    async (request) => {
      const { queue: name } = request.params;

      const item = (await queues.getQueues()).find((q) => q.name === name);
      if (!item) {
        throw new NotFoundError(`Queue '${name}' not found`);
      }

      // Starting queue if needed
      if (request.body.status === 'active') {
        await queues.resumeQueue(name);
      }
      // Pausing queue if needed
      if (request.body.status === 'paused') {
        await queues.pauseQueue(name);
      }

      return {
        content: (await queues.getQueues()).find((q) => q.name === name),
      };
    },
  );

  /**
   * Get jobs of a specific queue
   */
  fastify.get<{
    Params: SpecificQueueParamsType,
    Querystring: queues.JobPaginationQueryType,
  }>(
    '/:queue/jobs',
    {
      schema: {
        params: SpecificQueueParams,
        querystring: queues.JobPaginationQuery,
      },
      ezrAuth: {
        requireAdmin: true,
      },
    },
    async (request) => {
      const { queue: name } = request.params;

      const pagination = {
        count: request.query.count ?? 15,
        previous: request.query.previous ?? undefined,
      };

      // TODO: custom sort
      const jobs = await queues.getJobs(name, pagination);

      return {
        content: jobs,
        meta: {
          total: await queues.getCountJobs(name),
          count: jobs.length,
          size: pagination.count,
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
      ezrAuth: {
        access: Access.READ,
      },
    },
    async (request) => {
      const { queue: name, jobId } = request.params;
      const job = await queues.getJob(name, jobId);
      if (!job) {
        throw new NotFoundError(`Job "${jobId}" not found`);
      }

      const namespaceId = 'namespaceId' in job.data ? job.data.namespaceId : job.data.task.namespaceId;
      if (!request.namespaceIds?.includes(namespaceId)) {
        throw new HTTPError(`Job "${jobId}" doesn't match your namespaces`, StatusCodes.FORBIDDEN);
      }

      return { content: job };
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
    '/:queue/jobs/:jobId/_retry',
    {
      schema: {
        params: SpecificJobParams,
      },
      ezrAuth: {
        access: Access.READ_WRITE,
      },
    },
    async (request) => {
      const { queue: name, jobId } = request.params;
      const job = await queues.getJob(name, jobId);
      if (!job) {
        throw new NotFoundError(`Job "${jobId}" not found`);
      }

      const namespaceId = 'namespaceId' in job.data ? job.data.namespaceId : job.data.task.namespaceId;
      if (!request.namespaceIds?.includes(namespaceId)) {
        throw new HTTPError(`Job "${jobId}" doesn't match your namespaces`, StatusCodes.FORBIDDEN);
      }

      return { content: await queues.retryJob(name, jobId) };
    },
  );
};

export default router;
