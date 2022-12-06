import type { History } from '@prisma/client';
import prisma from '../lib/prisma';

/**
 * Get all history entry in DB
 *
 * @param opts Requests options
 *
 * @returns History entry list
 */
// TODO[feat]: Custom sort
export const getAllHistoryEntries = async (
  opts?: {
    count?: number,
    previous?: History['id']
  },
) => {
  await prisma.$connect();

  const entries = await prisma.history.findMany({
    take: opts?.count,
    skip: opts?.previous ? 1 : undefined, // skip the cursor if needed
    cursor: opts?.previous ? { id: opts.previous } : undefined,
    orderBy: {
      createdAt: 'desc',
    },
  });

  await prisma.$disconnect();

  return entries;
};

export default getAllHistoryEntries;
