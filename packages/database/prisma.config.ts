import { join } from 'node:path';

import { defineConfig } from 'prisma/config';

// oxlint-disable-next-line import/no-default-export
export default defineConfig({
  schema: join('prisma'),
});
