import { join } from 'node:path';

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import fastifyStatic from '@fastify/static';
import { StatusCodes } from 'http-status-codes';

import { z } from '~common/lib/zod';
import config from '~/lib/config';

import { requireAllowedNamespace } from '~/plugins/auth';
import { Access } from '~/models/access';

import * as responses from '~/routes/v2/responses';

import * as reports from '~/models/reports';
import { ReportFiles } from '~/models/reports/types';
import { getTask } from '~/models/tasks';

import { NotFoundError } from '~/types/errors';

const { reportDir } = config;

const SpecificReportParams = z.object({
  taskId: z.string().min(1)
    .describe('ID of the task'),

  year: z.string().min(1)
    .describe('Year of generation of the report'),

  yearMonth: z.string().regex(/^[0-9]{4}-[0-9]{2}$/)
    .describe('Year and month of generation of the report'),

  reportId: z.string().min(1)
    .describe('ID of the report'),
});

const router: FastifyPluginAsyncZod = async (fastify) => {
  // Setup decorator
  await fastify.register(fastifyStatic, {
    root: reportDir,
    serve: false,
  });

  fastify.route({
    method: 'GET',
    url: '/:year/:yearMonth/:reportId',
    schema: {
      summary: 'Get list of files for a generated report',
      tags: ['reports'],
      params: SpecificReportParams,
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(ReportFiles),
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

      const name = join(request.params.year, request.params.yearMonth, request.params.reportId);
      const filesOfReport = reportsOfTask[name];
      if (!filesOfReport) {
        throw new NotFoundError(`Report ${name} not found`);
      }

      return responses.buildSuccessResponse(filesOfReport, reply);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/:year/:yearMonth/:reportId.:type.:ext',
    schema: {
      summary: 'Get file of a generated report',
      tags: ['reports'],
      params: SpecificReportParams.and(z.object({
        type: z.string().min(1),
        ext: z.string().min(1),
      })),
      querystring: z.object({
        download: z.coerce.boolean().default(false),
      }),
      response: {
        [StatusCodes.OK]: z.unknown(),
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
      const filename = `${request.params.reportId}.${request.params.type}.${request.params.ext}`;
      const path = join(request.params.year, request.params.yearMonth, filename);
      if (request.query.download) {
        return reply.download(path, filename);
      }
      return reply.sendFile(path);
    },
  });
};

export default router;
