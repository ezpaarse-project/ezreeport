import { join } from 'node:path';
import { readFile } from 'node:fs/promises';

import type { FastifyPluginAsync } from 'fastify';
import fastifyStatic from '@fastify/static';

import config from '~/lib/config';
import { Type, type Static, Value } from '~/lib/typebox';

import authPlugin from '~/fastify/plugins/auth';

import { Access } from '~/models/access';
import { ReportResult, type ReportResultType } from '~/models/reports';
import { getTaskById } from '~/models/tasks';
import { ArgumentError, NotFoundError } from '~/types/errors';

const { outDir } = config.report;

const router: FastifyPluginAsync = async (fastify) => {
  await fastify.register(authPlugin, { prefix: 'reports' });

  // Setup decorator
  await fastify.register(
    fastifyStatic,
    {
      prefix: '/reports/',
      root: outDir,
      serve: false,
    },
  );

  /**
   * Get specific report
   */
  const GetReportParams = Type.Object({
    year: Type.String({ minLength: 1 }),
    yearMonth: Type.String({ minLength: 1 }),
    filename: Type.String({ minLength: 1 }),
  });
  const GetReportQueryParams = Type.Object({
    download: Type.Optional(
      Type.Any(),
    ),
  });
  fastify.get<{
    Params: Static<typeof GetReportParams>,
    Querystring: Static<typeof GetReportQueryParams>
  }>(
    '/:year/:yearMonth/:filename',
    {
      schema: {
        params: GetReportParams,
        querystring: GetReportQueryParams,
      },
      config: {
        auth: {
          access: Access.READ,
        },
      },
    },
    async (request, response) => {
      const { year, yearMonth, filename } = request.params;
      const reportFilename = filename.replace(/\..*$/, '');
      const basePath = join(outDir, year, yearMonth);

      // Check if not trying to access unwanted file
      const detailPath = join(basePath, `${reportFilename}.det.json`);
      if (new RegExp(`^${outDir}/.*\\.det\\.json$`, 'i').test(detailPath) === false) {
        throw new ArgumentError(`File path must be in the "${outDir}" folder. Resolved: "${detailPath}"`);
      }

      let detailFile: ReportResultType | undefined;
      try {
        detailFile = Value.Cast(
          ReportResult,
          JSON.parse(await readFile(detailPath, 'utf-8')),
        );
      } catch (error) {
        throw new ArgumentError(`File "${year}/${yearMonth}/${reportFilename}.det.json" not found`);
      }

      const task = await getTaskById(detailFile.detail.taskId, request.namespaceIds);
      if (!task) {
        throw new NotFoundError(`No report "${year}/${yearMonth}/${filename}" for your namespace`);
      }

      const path = join(year, yearMonth, filename);
      if (request.query.download) {
        return response.download(path, filename);
      }
      return response.sendFile(path);
    },
  );
};

export default router;
