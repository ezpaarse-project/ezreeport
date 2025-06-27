import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezreeport/models/lib/zod';
import { Recurrence } from '@ezreeport/models/recurrence';
import { ReportPeriod } from '@ezreeport/models/reports';
import { calcPeriodFromRecurrence, calcNextDateFromRecurrence } from '@ezreeport/models/lib/periods';

import * as responses from '~/routes/v2/responses';

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    method: 'GET',
    url: '/:recurrence/period',
    schema: {
      summary: 'Get period from recurrence',
      params: z.object({
        recurrence: Recurrence,
      }),
      querystring: z.object({
        reference: z.coerce.date().optional(),
        offset: z.coerce.number().optional(),
      }),
      response: {
        ...responses.describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: responses.SuccessResponse(ReportPeriod),
      },
    },
    handler: async (request, reply) => responses.buildSuccessResponse(
      calcPeriodFromRecurrence(
        request.query.reference ?? new Date(),
        request.params.recurrence,
        request.query.offset ?? 0,
      ),
      reply,
    ),
  });

  fastify.route({
    method: 'GET',
    url: '/:recurrence/nextDate',
    schema: {
      summary: 'Get next date from recurrence',
      params: z.object({
        recurrence: Recurrence,
      }),
      querystring: z.object({
        reference: z.coerce.date().optional(),
        offset: z.number().optional(),
      }),
      response: {
        ...responses.describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: responses.SuccessResponse(z.object({
          value: z.date(),
        })),
      },
    },
    handler: async (request, reply) => responses.buildSuccessResponse(
      {
        value: calcNextDateFromRecurrence(
          request.query.reference ?? new Date(),
          request.params.recurrence,
        ),
      },
      reply,
    ),
  });
};

export default router;
