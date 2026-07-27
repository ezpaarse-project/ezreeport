import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import {
  calcNextDateFromRecurrence,
  calcPeriodFromRecurrence,
} from '@ezreeport/models/lib/periods';
import { z, zStringToDay } from '@ezreeport/models/lib/zod';
import { Recurrence, RecurrenceOffset } from '@ezreeport/models/recurrence';
import { ReportPeriod } from '@ezreeport/models/reports';

import {
  buildSuccessResponse,
  describeErrors,
  zSuccessResponse,
} from '~/routes/v2/responses';

// oxlint-disable-next-line max-lines-per-function, require-await
const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    method: 'GET',
    url: '/:recurrence/period',
    schema: {
      deprecated: true,
      params: z.object({
        recurrence: Recurrence,
      }),
      querystring: z.object({
        offset: z.coerce
          .number()
          .int()
          .optional()
          .describe(
            'The offset, negative for previous, positive for next, 0 for current, default to 0'
          ),
        reference: zStringToDay
          .optional()
          .describe('The date used as reference, defaults to today'),
      }),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(ReportPeriod),
      },
      summary: 'Get period from recurrence',
      tags: ['recurrence'],
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
      deprecated: true,
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
      summary: 'Get next date from recurrence',
      tags: ['recurrence'],
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

  fastify.route({
    method: 'POST',
    url: '/:recurrence/_resolve/period',
    schema: {
      body: z
        .object({
          offset: z
            .number()
            .int()
            .optional()
            .describe(
              'The offset, negative for previous, positive for next, 0 for current, default to 0'
            ),
          reference: zStringToDay
            .optional()
            .describe('The date used as reference, defaults to today'),
        })
        .optional(),
      params: z.object({
        recurrence: Recurrence,
      }),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(ReportPeriod),
      },
      summary: 'Get period from recurrence',
      tags: ['recurrence'],
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) =>
      buildSuccessResponse(
        calcPeriodFromRecurrence(
          request.body?.reference ?? new Date(),
          request.params.recurrence,
          request.body?.offset ?? 0
        ),
        reply
      ),
  });

  fastify.route({
    method: 'POST',
    url: '/:recurrence/_resolve/nextDate',
    schema: {
      body: z
        .object({
          offset: RecurrenceOffset.optional().describe('The offset to apply'),
          reference: zStringToDay
            .optional()
            .describe('The date used as reference, defaults to today'),
        })
        .optional(),
      params: z.object({
        recurrence: Recurrence,
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
      summary: 'Get next date from recurrence',
      tags: ['recurrence'],
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) =>
      buildSuccessResponse(
        {
          value: calcNextDateFromRecurrence(
            request.body?.reference ?? new Date(),
            request.params.recurrence,
            request.body?.offset
          ),
        },
        reply
      ),
  });
};

// oxlint-disable-next-line no-default-export
export default router;
