import { join } from 'node:path';
import type { PrismaConfig } from 'prisma';

// oxlint-disable-next-line import/no-default-export
export default {
  schema: join('prisma'),
} satisfies PrismaConfig;
