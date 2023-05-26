import type { History, Namespace } from '~/lib/prisma';
import prisma from '~/lib/prisma';

/**
 * Get count of history entries in DB
 *
 * @param namespaceIds The namespaces of the task. If provided,
 * will restrict search to the namespace provided
 *
 * @returns The entries count
 */
export const getCountHistory = (
  namespaceIds?: string[],
): Promise<number> => prisma.history.count({
  where: {
    task: {
      namespaceId: {
        in: namespaceIds,
      },
    },
  },
});

/**
 * Get all history entry in DB
 *
 * @param opts Requests options
 * @param namespaceIds The namespaces of the task. If provided,
 * will restrict search to the namespace provided
 *
 * @returns History entry list
 */
// TODO[feat]: Custom sort
export const getAllHistoryEntries = (
  opts?: {
    count?: number,
    previous?: History['id']
  },
  namespaceIds?: Namespace['id'][],
) => prisma.history.findMany({
  take: opts?.count,
  skip: opts?.previous ? 1 : undefined, // skip the cursor if needed
  cursor: opts?.previous ? { id: opts.previous } : undefined,
  where: namespaceIds ? { task: { namespaceId: { in: namespaceIds } } } : undefined,
  select: {
    id: true,
    type: true,
    message: true,
    data: true,
    createdAt: true,

    task: {
      select: {
        id: true,
        name: true,
        recurrence: true,
        nextRun: true,
        lastRun: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,

        namespace: {
          select: {
            id: true,
            name: true,
            logoId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
});
