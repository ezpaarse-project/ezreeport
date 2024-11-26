import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '~/lib/zod';

import authPlugin, { requireAllowedNamespace } from '~/plugins/authv2';
import { Access } from '~/models/access';

import * as responses from '~/routes/v2/responses';

import * as reports from '~/models/reports';
import { ReportFilesOfTask, InputManualReport } from '~/models/reports/types';
import { queueGeneration } from '~/models/queues';
import { QueueName, GenerationData, GenerationDataType } from '~/models/queues/types';
import { getTask } from '~/models/tasks';

import { NotFoundError } from '~/types/errors';

import reportRoutes from './files';

const SpecificTaskParams = z.object({
  taskId: z.string().min(1)
    .describe('ID of the task'),
});

const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(authPlugin);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get list of generated reports, grouped by task',
      tags: ['reports'],
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(
          z.record(
            z.string().describe('Task ID'),
            ReportFilesOfTask,
          ),
        ),
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
      const filesPerTask = await reports.getReportsPerTasks();

      return responses.buildSuccessResponse(filesPerTask, reply);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/:taskId',
    schema: {
      summary: 'Get list of generated reports for a specific task',
      tags: ['reports', 'tasks'],
      params: SpecificTaskParams,
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(ReportFilesOfTask),
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
    preHandler: [
      async (request) => {
        const task = await getTask(request.params.taskId);
        return requireAllowedNamespace(request, task?.namespaceId ?? '');
      },
    ],
    handler: async (request, reply) => {
      const { taskId } = request.params;
      const reportsOfTask = await reports.getReportsOfTask(taskId);
      if (!reportsOfTask) {
        throw new NotFoundError(`Task ${request.params.taskId} doesn't have any reports`);
      }

      return responses.buildSuccessResponse(reportsOfTask, reply);
    },
  });

  fastify.route({
    method: 'POST',
    url: '/:taskId',
    schema: {
      summary: 'Start generation of report for a specific task',
      tags: ['reports', 'tasks'],
      params: SpecificTaskParams,
      body: InputManualReport,
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(
          z.object({
            queue: QueueName.describe('Queue name'),
            id: z.string().describe("Queue's ID"),
            data: GenerationData.describe("Queue's data"),
          }).describe("Queue's task created"),
        ),
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
      async (request) => {
        const task = await getTask(request.params.taskId);
        return requireAllowedNamespace(request, task?.namespaceId ?? '');
      },
    ],
    handler: async (request, reply) => {
      const task = await getTask(request.params.taskId);
      if (!task) {
        throw new NotFoundError(`Task ${request.params.taskId} not found`);
      }

      if (request.body.targets) {
        task.targets = request.body.targets;
      }

      const firstLevelDebug = !!request.body.period || !!request.body.targets;
      const secondLevelDebug = process.env.NODE_ENV !== 'production' && request.body.debug;

      const flow = await queueGeneration({
        task,
        period: request.body.period,
        origin: request.user?.username ?? 'unknown',
        shouldWriteActivity: firstLevelDebug,
        debug: secondLevelDebug,
      });
      const job = flow.children?.[0].job;

      return responses.buildSuccessResponse({
        id: job?.id ?? '',
        queue: 'generation' as const,
        data: job?.data as GenerationDataType,
      }, reply);
    },
  });

  fastify.register(reportRoutes, { prefix: '/:taskId' }); // Sub routes will be handled by reportRoutes
};

export default router;
