import Fastify, { type FastifyPluginAsync, type FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';

import { appLogger } from '~/lib/logger';
import config from '~/lib/config';

import loggerPlugin from '~/plugins/logger';

const { port, allowedOrigins: rawOrigins } = config;
const logger = appLogger.child({ scope: 'http' });

let fastify: FastifyInstance | undefined;

export default async function startHTTPServer(routes: FastifyPluginAsync) {
  const start = process.uptime();

  // Create Fastify instance
  fastify = Fastify({ logger: false });

  // Register cors
  const allowedOrigins = rawOrigins.split(',');
  await fastify.register(
    fastifyCors,
    {
      origin: allowedOrigins,
    },
  );

  await fastify.register(loggerPlugin);

  await fastify.register(routes);

  const address = await fastify.listen({ port, host: '::' });

  logger.info({
    address,
    port,
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Service listening',
  });

  return fastify;
}

process.on('SIGTERM', () => {
  if (!fastify) {
    return;
  }

  fastify.close()
    .then(() => logger.debug('Service closed'))
    .catch((err) => logger.error({ msg: 'Failed to close service', err }));
});
