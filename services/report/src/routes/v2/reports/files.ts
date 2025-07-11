import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezreeport/models/lib/zod';
import { ReportFiles } from '@ezreeport/models/reports';

import { appLogger } from '~/lib/logger';

import { requireAllowedNamespace } from '~/plugins/auth';
import { Access } from '~/models/access';

import {
  describeErrors,
  buildSuccessResponse,
  zSuccessResponse,
} from '~/routes/v2/responses';

import { getTask } from '~/models/tasks';
import {
  createReportReadStream,
  getAllReports,
} from '~/models/rpc/client/files';
import { NotFoundError } from '~/models/errors';

const SpecificReportParams = z.object({
  taskId: z.string().min(1).describe('ID of the task'),

  yearMonth: z
    .string()
    .regex(/^[0-9]{4}-[0-9]{2}$/)
    .describe('Year and month of generation of the report'),

  reportName: z.string().min(1).describe('ID of the report'),
});

// oxlint-disable-next-line max-lines-per-function, require-await
const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get list of files for a generated report',
      tags: ['reports'],
      params: z.object({
        taskId: z.string().min(1).describe('ID of the task'),
      }),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(
          z.record(z.string().describe('File name'), ReportFiles)
        ),
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
        access: Access.READ,
      },
    },
    preHandler: [
      async (request): Promise<void> => {
        const task = await getTask(request.params.taskId);
        return requireAllowedNamespace(request, task?.namespaceId ?? '');
      },
    ],
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const reportsOfTasks = await getAllReports();
      const reportOfTask = reportsOfTasks[request.params.taskId];
      if (!reportOfTask) {
        throw new NotFoundError(
          `Reports for task ${request.params.taskId} not found`
        );
      }

      return buildSuccessResponse(reportOfTask, reply);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/:yearMonth/:reportName',
    schema: {
      summary: 'Get list of files for a generated report',
      tags: ['reports'],
      params: SpecificReportParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(ReportFiles),
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
        access: Access.READ,
      },
    },
    preHandler: [
      // oxlint-disable-next-line require-await
      async (request) => {
        const task = await getTask(request.params.taskId);
        return requireAllowedNamespace(request, task?.namespaceId ?? '');
      },
    ],
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const reportsOfTasks = await getAllReports();
      const reportsOfTask = reportsOfTasks[request.params.taskId];
      if (!reportsOfTask) {
        throw new NotFoundError(
          `Reports for task ${request.params.taskId} not found`
        );
      }

      const reportId = `${request.params.yearMonth}/${request.params.reportName}`;
      const report = reportsOfTask[reportId];
      if (!report) {
        throw new NotFoundError(
          `Report for task ${request.params.taskId} not found`
        );
      }

      return buildSuccessResponse(report, reply);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/:yearMonth/:reportName.:type.:ext',
    schema: {
      summary: 'Get file of a generated report',
      tags: ['reports'],
      params: SpecificReportParams.and(
        z.object({
          type: z.string().min(1),
          ext: z.string().min(1),
        })
      ),
      querystring: z.object({
        download: z.coerce.boolean().default(false),
      }),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: z.unknown(),
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
        access: Access.READ,
      },
    },
    preHandler: [
      // oxlint-disable-next-line require-await
      async (request): Promise<void> => {
        const task = await getTask(request.params.taskId);
        return requireAllowedNamespace(request, task?.namespaceId ?? '');
      },
    ],
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const reportId = `${request.params.yearMonth}/${request.params.reportName}`;
      const filename = `${reportId}.${request.params.type}.${request.params.ext}`;

      const stream = await createReportReadStream(
        filename,
        request.params.taskId
      ).catch((err) => new Error('Failed to read file', { cause: err }));

      if (stream instanceof Error) {
        appLogger.error({
          msg: 'Error on file read',
          filename,
          err: stream,
        });
        throw stream;
      }

      return reply.send(stream);
    },
  });
};

// oxlint-disable-next-line no-default-exports
export default router;
