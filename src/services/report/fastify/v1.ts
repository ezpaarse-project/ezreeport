import { join } from 'node:path';
import type { FastifyPluginAsync } from 'fastify';
import fastifyStatic from '@fastify/static';
import { absolutePath as swaggerUiPath } from 'swagger-ui-dist';

import auth from './v1/auth';
import health from './v1/health';

const router: FastifyPluginAsync = async (fastify) => {
  fastify.decorateReply('apiVersion', 1);

  // Register swagger-ui dist files as static (on /doc)
  await fastify.register(
    fastifyStatic,
    {
      prefix: '/doc/',
      root: swaggerUiPath(),
    },
  );
  // Overriding default Swagger-UI initializer with custom one
  fastify.get('/doc/swagger-initializer.js', (request, reply) => {
    reply.sendFile('openapi.js', join(__dirname, 'v1'));
  });
  // Serving OpenAPI
  fastify.get('/doc/openapi.json', (request, reply) => {
    reply.sendFile('openapi.json', join(__dirname, 'v1'));
  });

  await fastify.register(auth, { prefix: '/me' });
  await fastify.register(health, { prefix: '/health' });
};

export default router;
