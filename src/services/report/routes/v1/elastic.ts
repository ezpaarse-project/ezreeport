import type { FastifyPluginAsync } from 'fastify';

import authPlugin from '~/plugins/auth';

import { Type, type Static } from '~/lib/typebox';
import { elasticIndexMapping, elasticListIndices } from '~/lib/elastic';

import { Access } from '~/models/access';
import { getReportingUserFromNamespace } from '~/models/namespaces';
import { ArgumentError } from '~/types/errors';

const router: FastifyPluginAsync = async (fastify) => {
  await fastify.register(authPlugin, { prefix: 'elastic' });

  const IndexQuery = Type.Partial(
    Type.Object({
      namespace: Type.String({ minLength: 1 }),
    }),
  );
  type IndexQueryType = Static<typeof IndexQuery>;

  /**
   * List all index (including aliases)
   */
  fastify.get<{
    Querystring: IndexQueryType,
  }>(
    '/indices',
    {
      schema: {
        querystring: IndexQuery,
      },
      ezrAuth: {
        access: Access.READ_WRITE,
      },
    },
    async (request) => {
      const { namespace = '' } = request.query;

      if (!request.user?.isAdmin) {
        if (!namespace) {
          throw new ArgumentError('You must provide a namespace id');
        }

        if (!request.namespaceIds?.includes(namespace)) {
          throw new ArgumentError("The provided namespace id doesn't match your namespaces");
        }
      }

      let elasticUser: string | undefined;
      if (namespace) {
        elasticUser = await getReportingUserFromNamespace(namespace);
      }

      return { content: await elasticListIndices(elasticUser) };
    },
  );

  const SpecificIndexParams = Type.Object({
    index: Type.String({ minLength: 1 }),
  });
  type SpecificIndexParamsType = Static<typeof SpecificIndexParams>;

  /**
   * Get mapping of index
   */
  fastify.get<{
    Querystring: IndexQueryType,
    Params: SpecificIndexParamsType
  }>(
    '/indices/:index',
    {
      schema: {
        querystring: IndexQuery,
        params: SpecificIndexParams,
      },
      ezrAuth: {
        access: Access.READ_WRITE,
      },
    },
    async (request) => {
      const { index } = request.params;
      const { namespace = '' } = request.query;

      if (!request.user?.isAdmin) {
        if (!namespace) {
          throw new ArgumentError('You must provide a namespace id');
        }

        if (!request.namespaceIds?.includes(namespace)) {
          throw new ArgumentError("The provided namespace id doesn't match your namespaces");
        }
      }

      let elasticUser: string | undefined;
      if (namespace) {
        elasticUser = await getReportingUserFromNamespace(namespace);
      }

      const mapping = await elasticIndexMapping(index, elasticUser);
      return { content: mapping };
    },
  );
};

export default router;
