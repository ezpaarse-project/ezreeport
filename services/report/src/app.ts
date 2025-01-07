import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';

import { appLogger } from '~/lib/logger';
import config from '~/lib/config';

import { initQueues } from '~/models/queues';
import { initCrons } from '~/models/crons';

import loggerPlugin from '~/plugins/logger';
import routes from '~/routes';

import { initTemplates } from './init';

const { port, allowedOrigins: rawOrigins } = config;

const start = async () => {
  appLogger.info({
    scope: 'node',
    env: process.env.NODE_ENV,
    logLevel: config.log.level,
    logDir: config.log.dir,
    msg: 'Service running',
  });

  // Create Fastify instance
  const fastify = Fastify({ logger: false });

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

  // Start listening
  try {
    const address = await fastify.listen({ port, host: '::' });

    appLogger.info({
      scope: 'http',
      address,
      startupDuration: process.uptime(),
      startupDurationUnit: 's',
      msg: 'Service listening',
    });

    await Promise.all([
      initQueues(),
      initCrons(),
      initTemplates(),
    ]);

    appLogger.info({
      scope: 'init',
      readyDuration: process.uptime(),
      readyDurationUnit: 's',
      msg: 'Service ready',
    });
  } catch (err) {
    appLogger.error(err);
    process.exit(1);
  }
};
start();
