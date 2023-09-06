import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

import { appLogger } from './lib/logger';
import config from './lib/config';

import formatPlugin from './fastify/plugins/format';
import loggerPlugin from './fastify/plugins/logger';
import routes from './fastify';

import { initTemplates } from './init';

const { port, allowedOrigins: rawOrigins } = config;

const start = async () => {
  // Create Fastify instance
  const fastify = Fastify({
    logger: false,
  });

  // Register TypeBox
  fastify.withTypeProvider<TypeBoxTypeProvider>();

  // Register cors
  const allowedOrigins = rawOrigins.split(',');
  await fastify.register(
    fastifyCors,
    {
      origin: allowedOrigins,
    },
  );

  // Register logger and format
  await fastify.register(formatPlugin);
  await fastify.register(loggerPlugin);

  // Register routes
  await fastify.register(routes);

  // Start listening
  try {
    const address = await fastify.listen({ port, host: '::' });
    appLogger.info(`[node] Service running in [${process.env.NODE_ENV}] mode`);
    appLogger.info(`[http] Service listening on [${address}] in [${process.uptime().toFixed(2)}]s`);

    initTemplates();
  } catch (err) {
    appLogger.error(err);
    process.exit(1);
  }
};
start();
