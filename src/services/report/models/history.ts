import type { History, Task } from '~/.prisma/client';
import prisma from '~/lib/prisma';

/**
 * Get count of history entries in DB
 *
 * @param institution The institution of the task. If provided,
 * will restrict search to the instituion provided
 *
 * @returns The entries count
 */
export const getCountHistory = async (institution?: Task['institution']): Promise<number> => {
  await prisma.$connect();

  const count = await prisma.history.count({
    where: {
      task: {
        institution,
      },
    },
  });

  await prisma.$disconnect();
  return count;
};

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
      task: {
        select: {
          id: true,
          name: true,
          institution: true,
          recurrence: true,
          nextRun: true,
          lastRun: true,
          enabled: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  await prisma.$disconnect();

  return entries;
};

export default getAllHistoryEntries;
