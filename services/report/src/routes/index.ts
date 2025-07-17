import type { FastifyPluginAsync } from 'fastify';

import v2 from './v2';

// oxlint-disable-next-line max-lines-per-function, require-await
const router: FastifyPluginAsync = async (fastify) => {
  // Default version
  await fastify.register(v2);

  // API versions
  await fastify.register(v2, { prefix: '/v2' });
};

// oxlint-disable-next-line no-default-exports
export default router;
