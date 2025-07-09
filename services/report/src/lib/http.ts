import createFastify, { type FastifyPluginAsync } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyIO from 'fastify-socket.io';

import { appLogger } from '~/lib/logger';
import config from '~/lib/config';
import { closeWS, registerWSNamespaces } from '~/lib/sockets';

import loggerPlugin from '~/plugins/logger';

const { port, allowedOrigins } = config;
const logger = appLogger.child({ scope: 'http' });

const corsOrigin: '*' | string[] = allowedOrigins === '*' ? '*' : allowedOrigins.split(',');

export default async function startHTTPServer(routes: FastifyPluginAsync) {
  const start = process.uptime();

  // Create Fastify instance
  const fastify = createFastify({ logger: false });

  // Register cors
  await fastify.register(fastifyCors, {
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  // Register logger
  await fastify.register(loggerPlugin);

  // Register routes
  await fastify.register(routes);

  // Register socket.io
  await fastify.register(fastifyIO, { cors: { origin: corsOrigin } });

  // Start server and wait for it to be ready
  const address = await fastify.listen({ port, host: '::' });
  await fastify.ready();

  // Register SocketIO namespaces
  registerWSNamespaces(fastify.io);

  // Register graceful shutdown
  process.on('SIGTERM', () => {
    closeWS(fastify.io);

    fastify.close()
      .then(() => logger.debug('Service HTTP closed'))
      .catch((err) => logger.error({ msg: 'Failed to close HTTP service', err }));
  });

  logger.info({
    address,
    port,
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Service listening',
  });

  return fastify;
}
