import type { FastifyPluginAsync } from 'fastify';

import v2 from './v2';

const router: FastifyPluginAsync = async (fastify) => {
  // Default version
  await fastify.register(v2);

  // API versions
  await fastify.register(v2, { prefix: '/v2' });
};

export default router;
