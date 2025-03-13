import type { FastifySchema, FastifyPluginAsync } from 'fastify';
import fastifySwagger, { type FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fp from 'fastify-plugin';

import { version } from '../../package.json';

/*
 * Common API schemas
 */
export const schemas = {
  security: {
    user: [{ 'User Token': [] }],
    admin: [{ 'API Key': [] }],
  },
};

type PluginOptions = {
  transform?: FastifyDynamicSwaggerOptions['transform'],
  transformObject?: FastifyDynamicSwaggerOptions['transformObject'],
};

/**
 * Fastify plugin to setup openapi
 *
 * @param fastify The fastify instance
 */
const formatBasePlugin: FastifyPluginAsync<PluginOptions> = async (fastify, opts) => {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'ezReeport API',
        version,
        contact: {
          name: 'ezTeam',
          url: 'https://github.com/ezpaarse-project',
          email: 'ezpaarse@couperin.org',
        },
        license: {
          name: 'CeCILL',
          url: 'https://github.com/ezpaarse-project/ezreeport/blob/master/LICENSE.txt',
        },
        description: 'Reporting service',
      },
      servers: [
        { url: '/', description: 'Direct' },
        { url: '/report/api/', description: 'ezMESURE' },
      ],
      tags: [
        { name: 'auth', description: 'Auth management' },
        { name: 'crons', description: 'Cron management' },
        { name: 'elastic', description: 'Elastic shorthands routes' },
        { name: 'generations', description: 'Task generations routes' },
        { name: 'health', description: 'Health management' },
        { name: 'memberships', description: 'Membership management' },
        { name: 'namespaces', description: 'Namespace management' },
        { name: 'queues', description: 'Queue management' },
        { name: 'reports', description: 'Report files management' },
        { name: 'task-activity', description: 'Task activity routes' },
        { name: 'task-presets', description: 'Task presets management' },
        { name: 'task-targets', description: 'Task targets routes' },
        { name: 'tasks', description: 'Task management' },
        { name: 'templates', description: 'Templates management' },
        { name: 'unsubscribe', description: 'Unsubscribe routes' },
        { name: 'users', description: 'User management' },
      ],
      components: {
        securitySchemes: {
          'User Token': {
            type: 'http',
            scheme: 'bearer',
            description: 'Used by user to interact with service',
          },
          'API Key': {
            name: 'X-API-Key',
            type: 'apiKey',
            in: 'header',
            description: 'Used by linked application to manage service',
          },
        },
      },
    },
    transformObject: opts.transformObject,
    transform: (transformData) => {
      // Apply custom transform
      const { route } = transformData;
      let { url } = transformData;
      let schema = transformData.schema as FastifySchema;
      if (opts.transform) {
        ({ schema, url } = opts.transform(transformData));
      }

      // Add security based on ezrAuth
      const { ezrAuth = {} } = route.config || {};
      const security = [...(schema?.security ?? [])];
      if (ezrAuth.requireAPIKey) {
        security.push(schemas.security.admin[0]);
      }
      if (ezrAuth.requireAdmin || ezrAuth.requireUser) {
        security.push(schemas.security.user[0]);
      }

      return {
        schema: {
          ...schema,
          security,
        },
        url,
      };
    },
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/doc',
  });
};

// Register plugin
const formatPlugin = fp(
  formatBasePlugin,
  { name: 'ezr-openapi', encapsulate: false },
);

export default formatPlugin;
