import type { FastifyPluginAsync, FastifySchema } from 'fastify';
import swagger, { type FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import fp from 'fastify-plugin';

// oxlint-disable-next-line import/extensions
import { version } from '../../package.json' with { type: 'json' };

/*
 * Common API schemas
 */
export const schemas = {
  security: {
    admin: [{ 'API Key': [] }],
    user: [{ 'User Token': [] }],
  },
};

type PluginOptions = {
  transform?: FastifyDynamicSwaggerOptions['transform'];
  transformObject?: FastifyDynamicSwaggerOptions['transformObject'];
};

const OPENAPI_INFOS = {
  contact: {
    email: 'ezpaarse@couperin.org',
    name: 'ezTEAM',
    url: 'https://github.com/ezpaarse-project',
  },
  description: 'Reporting service',
  license: {
    name: 'CeCILL',
    url: 'https://github.com/ezpaarse-project/ezreeport/blob/master/LICENSE.txt',
  },
  title: 'ezREEPORT API',
  version,
};

const OPENAPI_TAGS = [
  { description: 'Auth management', name: 'auth' },
  { description: 'Cron management', name: 'crons' },
  { description: 'Elastic shorthands routes', name: 'elastic' },
  { description: 'Task generations routes', name: 'generations' },
  { description: 'Health management', name: 'health' },
  { description: 'Membership management', name: 'memberships' },
  { description: 'Recurrence utilities', name: 'recurrence' },
  { description: 'Namespace management', name: 'namespaces' },
  { description: 'Report files management', name: 'reports' },
  { description: 'Task activity routes', name: 'task-activity' },
  { description: 'Task presets management', name: 'task-presets' },
  { description: 'Task targets routes', name: 'task-targets' },
  { description: 'Task management', name: 'tasks' },
  { description: 'Templates management', name: 'templates' },
  { description: 'Template tags management', name: 'template-tags' },
  { description: 'Unsubscribe routes', name: 'unsubscribe' },
  { description: 'User management', name: 'users' },
];

const wrapTransformWithAuth =
  (
    originalTransform?: FastifyDynamicSwaggerOptions['transform']
  ): FastifyDynamicSwaggerOptions['transform'] =>
  (transformData) => {
    // Apply custom transform
    const { route } = transformData;
    let { url } = transformData;
    let schema = transformData.schema as FastifySchema;
    if (originalTransform) {
      ({ schema, url } = originalTransform(transformData));
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
  };

/**
 * Fastify plugin to setup openapi
 *
 * @param fastify The fastify instance
 */
const openapiBasePlugin: FastifyPluginAsync<PluginOptions> = async (
  fastify,
  opts
) => {
  // Register routes as OpenAPI
  await fastify.register(swagger, {
    openapi: {
      components: {
        securitySchemes: {
          'API Key': {
            description: 'Used by linked application to manage service',
            in: 'header',
            name: 'X-API-Key',
            type: 'apiKey',
          },
          'User Token': {
            description: 'Used by user to interact with service',
            scheme: 'bearer',
            type: 'http',
          },
        },
      },
      info: OPENAPI_INFOS,
      servers: [
        { description: 'Direct', url: '/' },
        { description: 'ezMESURE', url: '/report/api/' },
      ],
      tags: OPENAPI_TAGS,
    },
    transform: wrapTransformWithAuth(opts.transform),
    transformObject: opts.transformObject,
  });

  // Serve UI
  await fastify.register(swaggerUi, {
    routePrefix: '/doc',
    staticCSP: true,
  });
};

// Register plugin
export const openapiPlugin = fp(openapiBasePlugin, {
  encapsulate: false,
  name: 'ezr-openapi',
});
