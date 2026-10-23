import type { AnyFigureHelper } from '~sdk/helpers/figures';
import type { TemplateBodyGrid } from '~sdk/templates';

type Position = {
  col: number;
  row: number;
};

export function slotToGridPosition(slot: number, maxCols: number): Position {
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
): { start: Position; end: Position } {
  // Resolve each slot to a grid position
  let slots = [index];
  if (figure && figure.slots.size > 0) {
    slots = [...figure.slots].toSorted();
  }

  const [startSlot] = slots;
  const endSlot = slots.at(-1) ?? 0;

  return {
    end: slotToGridPosition(endSlot, grid.cols),
    start: slotToGridPosition(startSlot, grid.cols),
  };
}
