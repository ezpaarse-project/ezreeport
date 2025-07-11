import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { zStringToDay, z } from '@ezreeport/models/lib/zod';
import { Recurrence } from '@ezreeport/models/recurrence';
import { ReportPeriod } from '@ezreeport/models/reports';
import {
  calcPeriodFromRecurrence,
  calcNextDateFromRecurrence,
} from '@ezreeport/models/lib/periods';

import {
  describeErrors,
  buildSuccessResponse,
  zSuccessResponse,
} from '~/routes/v2/responses';

// oxlint-disable-next-line max-lines-per-function, require-await
const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    method: 'GET',
    url: '/:recurrence/period',
    schema: {
      summary: 'Get period from recurrence',
      tags: ['recurrence'],
      params: z.object({
        recurrence: Recurrence,
      }),
      querystring: z.object({
        reference: zStringToDay
          .optional()
          .describe('The date used as reference, defaults to today'),
        offset: z.coerce
          .number()
          .int()
          .optional()
          .describe(
            'The offset, negative for previous, positive for next, 0 for current, default to 0'
          ),
      }),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(ReportPeriod),
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) =>
      buildSuccessResponse(
        calcPeriodFromRecurrence(
          request.query.reference ?? new Date(),
          request.params.recurrence,
          request.query.offset ?? 0
        ),
        reply
      ),
  });

  fastify.route({
    method: 'GET',
    url: '/:recurrence/nextDate',
    schema: {
      summary: 'Get next date from recurrence',
      tags: ['recurrence'],
      params: z.object({
        recurrence: Recurrence,
      }),
      querystring: z.object({
        reference: zStringToDay
          .optional()
          .describe('The date used as reference, defaults to today'),
      }),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(
          z.object({
            value: z.date(),
          })
        ),
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) =>
      buildSuccessResponse(
        {
          value: calcNextDateFromRecurrence(
            request.query.reference ?? new Date(),
            request.params.recurrence
          ),
        },
        reply
      ),
  });
};

// oxlint-disable-next-line no-default-exports
export default router;
