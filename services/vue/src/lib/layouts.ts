import type { AnyFigureHelper } from '~sdk/helpers/figures';
import type { TemplateBodyGrid } from '~sdk/templates';

export function slotToGridPosition(slot: number, maxCols: number) {
  const col = slot % maxCols;
  const row = Math.floor(slot / Math.max(1, maxCols));
  return {
    col,
    row,
  };
}

export function figureToGridPosition(
  figure: AnyFigureHelper | undefined,
  index: number,
  grid: TemplateBodyGrid
) {
  // Resolve each slot to a grid position
  let slots = [index];
  if (figure && figure.slots.size > 0) {
    slots = Array.from(figure.slots).sort();
  }

  const startSlot = slots[0];
  const endSlot = slots[slots.length - 1];

  return {
    start: slotToGridPosition(startSlot, grid.cols),
    end: slotToGridPosition(endSlot, grid.cols),
  };
}
