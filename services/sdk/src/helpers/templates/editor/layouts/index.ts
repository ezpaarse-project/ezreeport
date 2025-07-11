import type { AnyFigureHelper } from '../figures';
import { hashLayout, type LayoutHelper } from './templates';
import type { TaskLayoutHelper } from './tasks';

export type AnyLayoutHelper = LayoutHelper | TaskLayoutHelper;

export function isTaskLayoutHelper(
  layout: AnyLayoutHelper
): layout is TaskLayoutHelper {
  return 'at' in layout;
}

export function isTemplateLayoutHelper(
  layout: AnyLayoutHelper
): layout is LayoutHelper {
  return !isTaskLayoutHelper(layout);
}

export function hasLayoutHelperChanged(layout: AnyLayoutHelper): boolean {
  return layout.hash !== hashLayout(layout);
}

export function addFigureOfHelper(
  layout: AnyLayoutHelper,
  figure: AnyFigureHelper,
  index?: number
): AnyFigureHelper {
  if (layout.figures.some((fig) => fig.id === figure.id)) {
    throw new Error(`Figure "${figure.id}" already exists`);
  }
  layout.figures.splice(index ?? layout.figures.length, 0, figure);
  return figure;
}

export function removeFigureOfHelper(
  layout: AnyLayoutHelper,
  figure: AnyFigureHelper
): AnyLayoutHelper {
  const lay = layout;
  lay.figures = layout.figures.filter((fig) => fig.id !== figure.id);
  return layout;
}

export function updateFigureOfHelper(
  layout: AnyLayoutHelper,
  oldFigure: AnyFigureHelper,
  newFigure: AnyFigureHelper
): AnyLayoutHelper {
  const index = layout.figures.findIndex((fig) => fig.id === oldFigure.id);
  if (index < 0) {
    throw new Error(`Figure "${oldFigure.id}" not found`);
  }
  const lay = layout;
  lay.figures[index] = newFigure;
  return layout;
}

export * from './templates';
export * from './tasks';
