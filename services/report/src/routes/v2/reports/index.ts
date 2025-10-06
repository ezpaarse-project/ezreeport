import { randomUUID } from 'node:crypto';

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';
import { compact } from 'lodash';

import * as dfns from '@ezreeport/dates';
import { z } from '@ezreeport/models/lib/zod';
import {
  calcNextDateFromRecurrence,
  calcPeriodFromRecurrence,
} from '@ezreeport/models/lib/periods';

import authPlugin, { requireAllowedNamespace } from '~/plugins/auth';
import { Access } from '~/models/access';

import * as responses from '~/routes/v2/responses';

import {
  InputManualReport,
  ReportFilesOfTask,
  type ReportPeriodType,
} from '~/models/reports/types';
import { queueGeneration } from '~/models/queues/report/generation';
import { getAllReports } from '~/models/rpc/client/files';
import { getTask } from '~/models/tasks';
import { getTemplate } from '~/models/templates';
import { getNamespace } from '~/models/namespaces';

import { ArgumentError, ConflictError, NotFoundError } from '~/models/errors';

import reportRoutes from './files';

const SpecificTaskParams = z.object({
  taskId: z.string().min(1).describe('ID of the task'),
});

// oxlint-disable-next-line max-lines-per-function, require-await
const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(authPlugin);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get list of generated reports, grouped by task',
      tags: ['reports'],
      response: {
        ...responses.describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: responses.zSuccessResponse(
          z.record(z.string().describe('Task ID'), ReportFilesOfTask)
        ),
      },
    },
    config: {
      ezrAuth: {
        requireAdmin: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const reportsOfTasks = await getAllReports();

      return responses.buildSuccessResponse(reportsOfTasks, reply);
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
        ...responses.describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: responses.zSuccessResponse(
          z
            .object({
              id: z.string().describe("Queue's ID"),
            })
            .describe('Info to get progress of generation')
        ),
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
        access: Access.READ_WRITE,
      },
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
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
      const task = await getTask(request.params.taskId);
      if (!task) {
        throw new NotFoundError(`Task ${request.params.taskId} not found`);
      }
      const template = await getTemplate(task.extendedId);
      if (!template) {
        throw new NotFoundError(`Template ${task.extendedId} not found`);
      }
      const namespace = await getNamespace(task.namespaceId);
      if (!namespace) {
        throw new NotFoundError(`Namespace ${task.namespaceId} not found`);
      }

      // Resolve period
      let period: ReportPeriodType | undefined;
      if (!request.body.period) {
        period = calcPeriodFromRecurrence(new Date(), task.recurrence, -1);
      } else {
        period = request.body.period;

        // Check if period is compatible with task
        const expectedPeriodEnd = dfns.endOfDay(
          dfns.add(calcNextDateFromRecurrence(period.start, task.recurrence), {
            days: -1,
          })
        );
        if (!dfns.isSameDay(expectedPeriodEnd, period.end)) {
          const isoStart = dfns.formatISO(period.start);
          const isoParsedEnd = dfns.formatISO(period.end);
          const isoEnd = dfns.formatISO(expectedPeriodEnd);

          throw new ConflictError(
            `Custom period "${isoStart} to ${isoParsedEnd}" doesn't match task's recurrence (${task.recurrence}). Should be : "${isoStart} to ${isoEnd}")`
          );
        }
      }

      // Resolve targets
      const targets = compact(request.body.targets ?? task.targets);
      if (targets.length <= 0) {
        throw new ArgumentError('You must specify at least one target');
      }

      const firstLevelDebug = !!request.body.period || !!request.body.targets;
      const secondLevelDebug =
        process.env.NODE_ENV !== 'production' && request.body.debug;

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

// oxlint-disable-next-line no-default-exports
export default router;
