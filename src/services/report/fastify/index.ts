import type { FastifyPluginAsync } from 'fastify';

import v1 from './v1';

const router: FastifyPluginAsync = async (fastify) => {
  // Default version
  await fastify.register(v1);

  // API versions
  await fastify.register(v1, { prefix: '/v1' });
};

export default router;
