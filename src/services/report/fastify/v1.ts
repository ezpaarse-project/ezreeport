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
import queues from './v1/queues';
import templates from './v1/templates';
import unsubscribe from './v1/unsubscribe';
import adminNamespaces from './v1/admin/namespaces';
import adminUsers from './v1/admin/users';

const router: FastifyPluginAsync = async (fastify) => {
  fastify.decorateReply('apiVersion', 1);

  // Register doc files as static (on /doc)
  await fastify.register(
    fastifyStatic,
    {
      prefix: '/doc/',
      root: [
        join(__dirname, 'v1/public/doc'), // swagger-ui overrides + open api
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
  await fastify.register(queues, { prefix: '/queues' });
  await fastify.register(templates, { prefix: '/templates' });
  await fastify.register(unsubscribe, { prefix: '/unsubscribe' });

  await fastify.register(adminNamespaces, { prefix: '/admin/namespaces' });
  await fastify.register(adminUsers, { prefix: '/admin/users' });
};

export default router;
