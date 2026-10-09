import { join } from 'node:path';

import { defineConfig } from 'prisma/config';

// oxlint-disable-next-line import/no-default-export
export default defineConfig({
  datasource: {
    url: process.env['EZREEPORT_DATABASE_URL'] || process.env['DATABASE_URL'],
  },

  schema: join('prisma'),
});
