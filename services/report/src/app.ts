import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

import { appLogger } from '~/lib/logger';
import config from '~/lib/config';
import { initQueues } from '~/lib/bull';
import { initCrons } from '~/lib/cron';
import { ajv } from '~/lib/typebox';

import formatPlugin from '~/plugins/format';
import loggerPlugin from '~/plugins/logger';
import routes from '~/routes';

import { initNamespaces, initTemplates } from './init';

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
  const fastify = Fastify({ logger: false })
    // Register TypeBox
    .withTypeProvider<TypeBoxTypeProvider>()
    // Register ajv, avoiding multiple instances
    .setValidatorCompiler(({ schema }) => ajv.compile(schema));

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
      initNamespaces(),
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
