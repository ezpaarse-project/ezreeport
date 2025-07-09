import { getTaskPreset, upsertTaskPreset, type TaskPreset } from '~/modules/task-presets';

import { assignDependencies } from '~/helpers/permissions/decorator';

/**
 * Change visibility of a preset
 *
 * @param presetOrId Preset or Preset's id
 * @param hidden New state
 *
 * @returns Updated preset
 */
export async function changeTaskPresetVisibility(
  presetOrId: TaskPreset | string,
  hidden: boolean,
): Promise<TaskPreset> {
  let base = presetOrId;
  if (typeof base === 'string') {
    base = await getTaskPreset(presetOrId);
  }

  const preset = await upsertTaskPreset({
    id: base.id,
    name: base.name,
    templateId: base.templateId,
    recurrence: base.recurrence,
    fetchOptions: base.fetchOptions,
    hidden,
  });

  return preset;
}
assignDependencies(changeTaskPresetVisibility, [getTaskPreset, upsertTaskPreset]);
