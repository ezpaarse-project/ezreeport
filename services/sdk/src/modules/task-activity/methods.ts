import {
  type ApiRequestOptions,
  type ApiResponsePaginated,
  type SdkPaginated,
  apiRequestOptionsToQuery,
} from '~/lib/api';
import { client } from '~/lib/fetch';
import { transformCreated } from '~/lib/transform';

import type { RawTask } from '~/modules/tasks/types';
import { assignPermission } from '~/helpers/permissions/decorator';
import { transformTask } from '~/modules/tasks/methods';

import type { RawTaskActivity, TaskActivity } from './types';

export const transformActivity = (activity: RawTaskActivity): TaskActivity => ({
  ...transformCreated(activity),
  task: activity.task ? transformTask(activity.task as RawTask) : undefined,
});

type PaginatedActivity = SdkPaginated<TaskActivity>;

/**
 * Get all available activity
 *
 * @returns All activity' info
 */
export async function getAllActivity(
  opts?: ApiRequestOptions & { include?: string[] }
): Promise<PaginatedActivity> {
  const {
    content,
    meta: { total, count, page },
  } = await client.fetch<ApiResponsePaginated<RawTaskActivity>>(
    '/task-activity',
    {
      query: {
        ...apiRequestOptionsToQuery(opts),
        include: opts?.include,
      },
    }
  );

  return {
    count,
    items: content.map(transformActivity),
    page,
    total,
  };
}
assignPermission(getAllActivity, 'GET /tasks-activity', true);
