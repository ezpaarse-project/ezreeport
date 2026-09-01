import { join } from 'node:path';

import { defineConfig, env } from 'prisma/config';

// oxlint-disable-next-line import/no-default-export
export default defineConfig({
  datasource: {
    url: env('DATABASE_URL'),
  },

  schema: join('prisma'),
});
