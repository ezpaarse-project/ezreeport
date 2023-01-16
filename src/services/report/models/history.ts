import type { History, Task } from '@prisma/client';
import prisma from '~/lib/prisma';

/**
 * Get all history entry in DB
 *
 * @param opts Requests options
 * @param instituion he institution of the task. If provided,
 * will restrict search to the instituion provided
 *
 * @returns History entry list
 */
// TODO[feat]: Custom sort
export const getAllHistoryEntries = async (
  opts?: {
    count?: number,
    previous?: History['id']
  },
  institution?: Task['institution'],
) => {
  await prisma.$connect();

  const entries = await prisma.history.findMany({
    take: opts?.count,
    skip: opts?.previous ? 1 : undefined, // skip the cursor if needed
    cursor: opts?.previous ? { id: opts.previous } : undefined,
    where: institution ? { task: { institution } } : undefined,
    include: {
      task: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  await prisma.$disconnect();

  return entries;
};

export default getAllHistoryEntries;
