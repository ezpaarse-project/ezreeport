import type { TaskActivity, Namespace } from '~/lib/prisma';
import prisma from '~/lib/prisma';
import { buildPagination } from './pagination';
import { Type, type Static } from '~/lib/typebox';

const {
  PaginationQuery: TaskActivityPaginationQuery,
  buildPrismaArgs,
} = buildPagination({
  model: {} as Record<keyof TaskActivity, unknown>,

  primaryKey: 'id',
  previousType: Type.String(),
  sortKeys: [
    'type',
    'taskId',
    'createdAt',
  ],
});

export { TaskActivityPaginationQuery };
export type TaskActivityPaginationQueryType = Static<typeof TaskActivityPaginationQuery>;

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
export const getAllTaskActivityEntries = (
  opts?: TaskActivityPaginationQueryType,
  namespaceIds?: Namespace['id'][],
) => prisma.taskActivity.findMany({
  ...buildPrismaArgs(opts || {}),
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
