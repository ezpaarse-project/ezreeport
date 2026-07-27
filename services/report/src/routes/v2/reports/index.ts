import { randomUUID } from 'node:crypto';

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';
import { compact } from 'lodash';

import * as dfns from '@ezreeport/dates';
import {
  calcNextDateFromRecurrence,
  calcPeriodFromRecurrence,
} from '@ezreeport/models/lib/periods';
import { z } from '@ezreeport/models/lib/zod';

import { Access } from '~/models/access';
import { ConflictError, NotFoundError } from '~/models/errors';
import { getNamespace } from '~/models/namespaces';
import { queueGeneration } from '~/models/queues/report/generation';
import {
  InputManualReport,
  ReportFilesOfTask,
  type ReportPeriodType,
} from '~/models/reports/types';
import { getAllReports } from '~/models/rpc/client/files';
import { getTask } from '~/models/tasks';
import { getTemplate } from '~/models/templates';

import { authPlugin, requireAllowedNamespace } from '~/plugins/auth';
import * as responses from '~/routes/v2/responses';

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
      summary: 'Get list of generated reports, grouped by task',
      tags: ['reports'],
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
      body: InputManualReport,
      params: SpecificTaskParams,
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
      summary: 'Start generation of report for a specific task',
      tags: ['reports', 'tasks'],
    },
    config: {
      ezrAuth: {
        access: Access.READ_WRITE,
        requireUser: true,
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
      if (request.body.period) {
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
      } else {
        period = calcPeriodFromRecurrence(new Date(), task.recurrence, -1);
      }

      // Resolve targets
      const targets = compact(request.body.targets ?? task.targets);

      const firstLevelDebug =
        Boolean(request.body.period) || Boolean(request.body.targets);
      const secondLevelDebug =
        process.env.NODE_ENV !== 'production' && request.body.debug;

      const id = randomUUID();
      await queueGeneration(
        {
          id,
          namespace,
          origin: request.user?.username ?? 'unknown',
          period,
          printDebug: secondLevelDebug,
          targets,
          task,
          template,
          writeActivity: !firstLevelDebug && !secondLevelDebug,
        },
        // Keep message for 1 min, otherwise will be aborted (only in test mode)
        firstLevelDebug || secondLevelDebug ? 1 * 60 * 1000 : undefined
      );

      return responses.buildSuccessResponse({ id }, reply);
    },
  });

  fastify.register(reportRoutes, { prefix: '/:taskId' }); // Sub routes will be handled by reportRoutes
};

// oxlint-disable-next-line no-default-export
export default router;
