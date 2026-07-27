import { assignDependencies } from '~/helpers/permissions/decorator';
import { type Task, getTask, upsertTask } from '~/modules/tasks';

export * from './editor';
export * from './recurrence';

/**
 * Change enable state of a task
 *
 * @param taskOrId Task or Task's id
 * @param enabled New state
 *
 * @returns Updated task
 */
export async function changeTaskEnableState(
  taskOrId: Omit<Task, 'template'> | string,
  enabled: boolean
): Promise<Task> {
  const base = await getTask(taskOrId);

  const task = await upsertTask({
    description: base.description,
    enabled,
    extendedId: base.extendedId,
    id: base.id,
    lastExtended: base.lastExtended,
    name: base.name,
    namespaceId: base.namespaceId,
    nextRun: base.nextRun,
    recurrence: base.recurrence,
    recurrenceOffset: base.recurrenceOffset,
    targets: base.targets,
    template: base.template,
  });

  return task;
}
assignDependencies(changeTaskEnableState, [getTask, upsertTask]);
