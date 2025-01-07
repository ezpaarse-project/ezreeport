import { client } from '~/lib/fetch';
import { transformCreated } from '~/lib/transform';
import {
  apiRequestOptionsToQuery,
  type ApiResponsePaginated,
  type ApiRequestOptions,
  type SdkPaginated,
} from '~/lib/api';

import { assignPermission } from '~/helpers/permissions/decorator';

import { transformTask } from '~/modules/tasks/methods';
import type { RawTask } from '~/modules/tasks/types';

import type { RawTaskActivity, TaskActivity } from './types';

export const transformActivity = (t: RawTaskActivity): TaskActivity => ({
  ...transformCreated(t),
  task: t.task ? transformTask(t.task as RawTask) : undefined,
});

type PaginatedActivity = SdkPaginated<TaskActivity>;

/**
 * Get all available activity
 *
 * @returns All activity' info
 */
export async function getAllActivity(
  opts?: ApiRequestOptions & { include?: string[] },
): Promise<PaginatedActivity> {
  const {
    content,
    meta: {
      total, count, page,
    },
  } = await client.fetch<ApiResponsePaginated<RawTaskActivity>>(
    '/task-activity',
    {
      query: {
        ...apiRequestOptionsToQuery(opts),
        include: opts?.include,
      },
    },
  );

  return {
    items: content.map(transformActivity),
    total,
    count,
    page,
  };
}
assignPermission(getAllActivity, 'GET /tasks-activity', true);
