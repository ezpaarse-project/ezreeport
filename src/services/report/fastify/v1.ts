import { join } from 'node:path';
import type { FastifyPluginAsync } from 'fastify';
import fastifyStatic from '@fastify/static';
import { absolutePath as swaggerUiPath } from 'swagger-ui-dist';

import tasks from './v1/tasks';
import tasksActivity from './v1/tasksActivity';
import files from './v1/files';
import auth from './v1/auth';
import health from './v1/health';
import crons from './v1/crons';

const router: FastifyPluginAsync = async (fastify) => {
  fastify.decorateReply('apiVersion', 1);

  // Register doc files as static (on /doc)
  await fastify.register(
    fastifyStatic,
    {
      prefix: '/doc/',
      root: [
        join(__dirname, 'v1/doc'), // swagger-ui overrides + open api
        swaggerUiPath(), // swagger-ui
      ],
    },
  );

  await fastify.register(tasks, { prefix: '/tasks' });
  await fastify.register(tasksActivity, { prefix: '/tasks-activity' });
  await fastify.register(files, { prefix: '/reports' });
  await fastify.register(auth, { prefix: '/me' });
  await fastify.register(health, { prefix: '/health' });
  await fastify.register(crons, { prefix: '/crons' });
};

export default router;
