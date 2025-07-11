import type { TaskBodyLayout } from '~/modules/tasks';

import type { AnyFigureHelper } from '../figures';
import {
  type LayoutHelper,
  createLayoutHelper,
  createLayoutHelperFrom,
  layoutHelperToJSON,
} from './templates';

export interface TaskLayoutHelper extends LayoutHelper {
  at: number;
}

export function createTaskLayoutHelper(
  figures: AnyFigureHelper[],
  at: number
): TaskLayoutHelper {
  const layout = createLayoutHelper(figures);
  return {
    ...layout,
    at,
  };
}

export function createTaskLayoutHelperFrom(
  layout: TaskBodyLayout
): TaskLayoutHelper {
  const base = createLayoutHelperFrom(layout);
  return createTaskLayoutHelper(base.figures, layout.at);
}

export function taskLayoutHelperToJSON(
  layout: TaskLayoutHelper
): TaskBodyLayout {
  return {
    ...layoutHelperToJSON(layout),
    at: layout.at,
  };
}
