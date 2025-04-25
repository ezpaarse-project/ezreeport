import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezreeport/models/lib/zod';
// import { ReportResult, type ReportResultType } from '@ezreeport/models/reports';

import { appLogger } from '~/lib/logger';

import { requireAllowedNamespace } from '~/plugins/auth';
import { Access } from '~/models/access';

import * as responses from '~/routes/v2/responses';

import { getTask } from '~/models/tasks';
// import { ArgumentError } from '~/models/errors';
import { createReportReadStream } from '~/models/rpc/client/files';

const SpecificReportParams = z.object({
  taskId: z.string().min(1)
    .describe('ID of the task'),

  yearMonth: z.string().regex(/^[0-9]{4}-[0-9]{2}$/)
    .describe('Year and month of generation of the report'),

  reportName: z.string().min(1)
    .describe('ID of the report'),
});

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    method: 'GET',
    url: '/:yearMonth/:reportName',
    schema: {
      summary: 'Get list of files for a generated report',
      tags: ['reports'],
      params: SpecificReportParams,
      // response: {
      //   ...responses.describeErrors([
      //     StatusCodes.BAD_REQUEST,
      //     StatusCodes.UNAUTHORIZED,
      //     StatusCodes.FORBIDDEN,
      //     StatusCodes.NOT_FOUND,
      //     StatusCodes.INTERNAL_SERVER_ERROR,
      //   ]),
      //   [StatusCodes.OK]: responses.SuccessResponse(ReportFiles),
      // },
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
    handler: async () => {
      // TODO: get list of files across nodes
      throw new Error('Not implemented');
    },
  });

  fastify.route({
    method: 'GET',
    url: '/:yearMonth/:reportName.:type.:ext',
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
        ...responses.describeErrors([
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
      async (request) => {
        const task = await getTask(request.params.taskId);
        return requireAllowedNamespace(request, task?.namespaceId ?? '');
      },
    ],
    handler: async (request, reply) => {
      const reportId = `${request.params.yearMonth}/${request.params.reportName}`;
      const filename = `${reportId}.${request.params.type}.${request.params.ext}`;

      const stream = await createReportReadStream(filename, request.params.taskId)
        .catch((err) => new Error('Failed to read file', { cause: err }));

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

export default router;
