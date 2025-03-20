import { randomUUID } from 'node:crypto';

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';
import { compact } from 'lodash';

import * as dfns from '~common/lib/date-fns';
import { z } from '~common/lib/zod';

import authPlugin, { requireAllowedNamespace } from '~/plugins/auth';
import { Access } from '~/models/access';

import * as responses from '~/routes/v2/responses';

import * as reports from '~/models/reports';
import { ReportFilesOfTask, InputManualReport, type ReportPeriodType } from '~/models/reports/types';
import { queueGeneration } from '~/models/queues/report/generation';
import { getTask } from '~/models/tasks';
import { getTemplate } from '~/models/templates';
import { getNamespace } from '~/models/namespaces';
import { calcNextDateFromRecurrence, calcPeriodFromRecurrence } from '~/models/recurrence';

import { ArgumentError, ConflictError, NotFoundError } from '~/models/errors';

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
            id: z.string().describe("Queue's ID"),
          }).describe('Info to get progress of generation'),
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
      if (!task) { throw new NotFoundError(`Task ${request.params.taskId} not found`); }
      const template = await getTemplate(task.extendedId);
      if (!template) { throw new NotFoundError(`Template ${task.extendedId} not found`); }
      const namespace = await getNamespace(task.namespaceId);
      if (!namespace) { throw new NotFoundError(`Namespace ${task.namespaceId} not found`); }

      // Resolve period
      let period: ReportPeriodType | undefined;
      if (!request.body.period) {
        period = calcPeriodFromRecurrence(new Date(), task.recurrence, -1);
      } else {
        period = request.body.period;

        // Check if period is compatible with task
        const expectedPeriodEnd = dfns.endOfDay(
          dfns.add(
            calcNextDateFromRecurrence(period.start, task.recurrence),
            { days: -1 },
          ),
        );
        if (!dfns.isSameDay(expectedPeriodEnd, period.end)) {
          const isoStart = dfns.formatISO(period.start);
          const isoParsedEnd = dfns.formatISO(period.end);
          const isoEnd = dfns.formatISO(expectedPeriodEnd);

          throw new ConflictError(`Custom period "${isoStart} to ${isoParsedEnd}" doesn't match task's recurrence (${task.recurrence}). Should be : "${isoStart} to ${isoEnd}")`);
        }
      }

      // Resolve targets
      const targets = compact(request.body.targets ?? task.targets);
      if (targets.length <= 0) {
        throw new ArgumentError('You must specify at least one target');
      }

      const firstLevelDebug = !!request.body.period || !!request.body.targets;
      const secondLevelDebug = process.env.NODE_ENV !== 'production' && request.body.debug;

      const id = randomUUID();
      await queueGeneration({
        id,
        task,
        namespace,
        template,
        period,
        targets,
        origin: request.user?.username ?? 'unknown',
        writeActivity: !firstLevelDebug && !secondLevelDebug,
        printDebug: secondLevelDebug,
      });

      return responses.buildSuccessResponse({ id }, reply);
    },
  });

  fastify.register(reportRoutes, { prefix: '/:taskId' }); // Sub routes will be handled by reportRoutes
};

export default router;
