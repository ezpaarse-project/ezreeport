import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '~/lib/zod';

import { requireAllowedNamespace } from '~/plugins/authv2';
import { Access } from '~/models/access';

import * as responses from '~/routes/v2/responses';

import * as queues from '~/models/queues';
import { FormattedJob, QueueName } from '~/models/queues/types';

import { PaginationQuery, PaginationResponse } from '~/models/pagination/types';
import { buildPaginatedResponse } from '~/models/pagination';

import { NotFoundError } from '~/types/errors';

const SpecificQueueParams = z.object({
  name: QueueName
    .describe('Name of the queue'),
});

const SpecificJobParams = SpecificQueueParams.and(z.object({
  jobId: z.string().min(1)
    .describe('Job id'),
}));

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get all jobs of a queue',
      tags: ['queues'],
      params: SpecificQueueParams,
      querystring: PaginationQuery.omit({ sort: true }),
      response: {
        [StatusCodes.OK]: PaginationResponse(FormattedJob),
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
      const jobs = await queues.getJobsOfQueue(
        request.params.name,
        request.query,
      );

      // Remove detail of result
      const formatted = await Promise.all(jobs.map((j) => ({
        ...j,
        result: {
          ...(j.result ?? {}),
          detail: undefined,
        },
      })));

      return buildPaginatedResponse(
        formatted,
        {
          page: request.query.page,
          total: await queues.countJobs(request.params.name),
        },
        reply,
      );
    },
  });

  fastify.route({
    method: 'GET',
    url: '/:jobId',
    schema: {
      summary: 'Get a job',
      tags: ['queues'],
      params: SpecificJobParams,
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(FormattedJob),
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
      async (request) => {
        const job = await queues.getJob(request.params.name, request.params.jobId);
        return requireAllowedNamespace(request, job?.data?.task?.namespaceId ?? '');
      },
    ],
    handler: async (request, reply) => {
      const job = await queues.getJob(request.params.name, request.params.jobId);
      if (!job) {
        throw new NotFoundError(`Job ${request.params.jobId} not found`);
      }

      return responses.buildSuccessResponse(job, reply);
    },
  });

  fastify.route({
    method: 'POST',
    url: '/:jobId',
    schema: {
      summary: 'Retry a job',
      tags: ['queues'],
      params: SpecificJobParams,
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(FormattedJob),
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
      async (request) => {
        const job = await queues.getJob(request.params.name, request.params.jobId);
        return requireAllowedNamespace(request, job?.data?.task?.namespaceId ?? '');
      },
    ],
    handler: async (request, reply) => {
      let job = await queues.getJob(request.params.name, request.params.jobId);
      if (!job) {
        throw new NotFoundError(`Job ${request.params.jobId} not found`);
      }

      job = await queues.restartJob(request.params.name, request.params.jobId);
      if (!job) {
        throw new NotFoundError(`Job ${request.params.jobId} not found`);
      }

      return responses.buildSuccessResponse(job, reply);
    },
  });
};

export default router;
