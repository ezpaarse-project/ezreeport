import { assignDependencies } from '~/helpers/permissions/decorator';

import { getTask, upsertTask, type Task } from '~/modules/tasks';

export * from './editor';

/**
 * Change enable state of a task
 *
 * @param taskOrId Task or Task's id
 * @param enabled New state
 *
 * @returns Updated task
 */
// eslint-disable-next-line import/prefer-default-export
export async function changeTaskEnableState(
  taskOrId: Omit<Task, 'template'> | string,
  enabled: boolean,
): Promise<Task> {
  const base = await getTask(taskOrId);

  const task = await upsertTask({
    id: base.id,
    name: base.name,
    description: base.description,
    extendedId: base.extendedId,
    namespaceId: base.namespaceId,
    nextRun: base.nextRun,
    recurrence: base.recurrence,
    targets: base.targets,
    template: base.template,
    lastExtended: base.lastExtended,
    enabled,
  });

  return task;
}
assignDependencies(changeTaskEnableState, [getTask, upsertTask]);
