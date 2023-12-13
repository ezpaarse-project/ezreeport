import type { TaskActivity, Namespace } from '~/lib/prisma';
import prisma from '~/lib/prisma';

/**
 * Get count of tasks' activity entries in DB
 *
 * @param namespaceIds The namespaces of the task. If provided,
 * will restrict search to the namespace provided
 *
 * @returns The entries count
 */
export const getCountTaskActivity = (
  namespaceIds?: string[],
): Promise<number> => prisma.taskActivity.count({
  where: {
    task: {
      namespaceId: {
        in: namespaceIds,
      },
    },
  },
});

/**
 * Get all taskActivity entry in DB
 *
 * @param opts Requests options
 * @param namespaceIds The namespaces of the task. If provided,
 * will restrict search to the namespace provided
 *
 * @returns TaskActivity entry list
 */
// TODO[feat]: Custom sort
export const getAllTaskActivityEntries = (
  opts?: {
    count?: number,
    previous?: TaskActivity['id']
  },
  namespaceIds?: Namespace['id'][],
) => prisma.taskActivity.findMany({
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
