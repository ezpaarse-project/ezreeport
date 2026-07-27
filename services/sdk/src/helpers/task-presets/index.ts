import { assignDependencies } from '~/helpers/permissions/decorator';
import {
  type TaskPreset,
  getTaskPreset,
  upsertTaskPreset,
} from '~/modules/task-presets';

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
  hidden: boolean
): Promise<TaskPreset> {
  let base = presetOrId;
  if (typeof base === 'string') {
    base = await getTaskPreset(presetOrId);
  }

  const preset = await upsertTaskPreset({
    fetchOptions: base.fetchOptions,
    hidden,
    id: base.id,
    name: base.name,
    recurrence: base.recurrence,
    recurrenceOffset: base.recurrenceOffset,
    templateId: base.templateId,
  });

  return preset;
}
assignDependencies(changeTaskPresetVisibility, [
  getTaskPreset,
  upsertTaskPreset,
]);
