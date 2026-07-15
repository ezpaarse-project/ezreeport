import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import createFastify, {
  type FastifyInstance,
  type FastifyPluginAsync,
} from 'fastify';
import fastifyIO from 'fastify-socket.io';

import config from '~/lib/config';
import { appLogger } from '~/lib/logger';
import { closeWS, registerWSNamespaces } from '~/lib/sockets';

import { loggerPlugin } from '~/plugins/logger';

import { RateLimitStore } from './http-rate-limit';

const { port, allowedOrigins, allowedProxies } = config;
const logger = appLogger.child({ scope: 'http' });

// Split origins while allowing *
const corsOrigin: '*' | string[] =
  allowedOrigins === '*' ? '*' : allowedOrigins.split(',');

// Split proxies while allowing *
let trustProxy: true | string[] =
  allowedProxies === '*' ? true : allowedProxies.split(',');

// oxlint-disable-next-line no-magic-numbers - One day as seconds
const CACHE_OPTIONS_DURATION = 24 * 60 * 60;

export async function startHTTPServer(
  routes: FastifyPluginAsync
): Promise<FastifyInstance> {
  const start = process.uptime();

  // Create Fastify instance
  const fastify = createFastify({
    trustProxy,
    logger: false,
  });

  // Register cors
  await fastify.register(cors, {
    origin: corsOrigin,
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-API-Key'],
    methods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'DELETE'],
    credentials: false,
    cacheControl: CACHE_OPTIONS_DURATION,
    maxAge: CACHE_OPTIONS_DURATION,
  });

  // Register helmet
  await fastify.register(helmet, {
    crossOriginEmbedderPolicy: true,
  });

  // Register rate limit
  await fastify.register(rateLimit, {
    global: false, // don't apply these settings to all the routes of the context
    store: RateLimitStore,
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
  process.on('SIGTERM', async () => {
    closeWS(fastify.io);

    try {
      await fastify.close();
      logger.debug('Service HTTP closed');
    } catch (err) {
      logger.error({ msg: 'Failed to close HTTP service', err });
    }
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
