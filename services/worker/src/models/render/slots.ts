import type { TemplateBodyGridType, FigureType } from '@ezreeport/models/templates';

import type {
  Size,
  Area,
  Margin,
} from './types';

// FIXME: WTF + still can have space
/**
 * Calculating modifier to apply to margin. Useful on x/y pos of slots, because else it can
 * create too little margin.
 *
 * The math that function is using is crappy and kinda black magic (ty Geogebra) and should
 * be reworked at some time.
 *
 * @param x The margin you want to apply
 *
 * @returns The modifier
 *
 * @deprecated Will be removed once a better solution is found
 */
const calcModifier = (x: number) => 1.1607 / (1 - (1.405 * (Math.E ** (-0.604 * x))));

/**
 * Generate slots according to template's grid definition
 *
 * @param viewport Page's viewport
 * @param grid Template's grid definition
 * @param margin Spaces between 2 slots
 *
 * @returns The slots position & dimensions
 */
export function generateSlots(viewport: Area, grid: TemplateBodyGridType, margin: Margin) {
  const baseSlots = Array(grid.rows * grid.cols).fill(0).map<Area>((_v, i, arr) => {
    const prev = arr[i - 1] as Area | undefined;

    const modifierH = calcModifier(grid.cols);
    const modifierV = calcModifier(grid.rows);

    const slot = {
      x: prev ? (prev.x + prev.width + (modifierH * (margin.horizontal / 2))) : viewport.x,
      y: prev?.y ?? viewport.y,
      width: (viewport.width / grid.cols) - (margin.horizontal / 2),
      height: (viewport.height / grid.rows) - (margin.vertical / 2),
    };

    if (prev && i % grid.cols === 0) {
      slot.x = viewport.x;
      slot.y = prev.y + prev.height + (modifierV * (margin.vertical / 2));
    }

    // Reassign param to access to previous
    // eslint-disable-next-line no-param-reassign
    arr[i] = slot;
    return slot;
  });

  return baseSlots;
}

/**
 * Resolve size to add when slots are manually provided in template
 *
 * @param indices Slots indices wanted by template
 * @param nextSlot Next slot wanted by template
 * @param grid Template's grid definition
 * @param margin Spaces between 2 slots
 *
 * @returns The size to add to the base slot
 */
function resolveManualFigureSlot(
  indices: number[],
  nextSlot: Area,
  grid: TemplateBodyGridType,
  margin: Margin,
): Size {
  const additionalSize: Size = {
    width: 0,
    height: 0,
  };

  if (
    indices.every(
      // Every index on same row
      (sIndex, j) => Math.floor(sIndex / grid.cols) === Math.floor(indices[0] / grid.cols)
        // Possible (ex: we have 3 cols, and we're asking for col 1 & 3 but not 2)
        && (j === 0 || sIndex - indices[j - 1] === 1),
    )
  ) {
    additionalSize.width = nextSlot.width + margin.horizontal;
  }

  if (
    indices.every(
      // Every index on same colon
      (slotIndex, j) => slotIndex % grid.cols === indices[0] % grid.cols
        // Possible (ex: we have 3 rows, and we're asking for row 1 & 3 but not 2)
        && (j === 0 || slotIndex - indices[j - 1] === grid.cols),
    )
  ) {
    additionalSize.height = nextSlot.height + margin.vertical;
  }

  return additionalSize;
}

/**
 * Resolve slot used by current iteration
 *
 * @param slots Possible slots (@see {@link generateSlots})
 * @param figures Current layout's figures
 * @param figureIndex Current iteration of figure
 * @param grid Template's grid definition
 * @param viewport Page's viewport
 * @param margin Spaces between 2 slots
 *
 * @returns The figure & the slot
 */
export function resolveSlot(
  slots: Area[],
  figures: FigureType[],
  figureIndex: number,
  grid: TemplateBodyGridType,
  viewport: Area,
  margin: Margin,
) {
  const figure = figures[figureIndex];
  let slot: Area;

  // Slot resolution
  if (figure.slots && figure.slots.length > 0) {
    // Manual mode
    const indices = [...figure.slots].sort();
    // Take first wanted slot by default
    slot = { ...slots[indices[0]] };

    if (indices.length === slots.length) {
      // Take whole space if all slots are needed
      slot = { ...viewport };
    } else if (indices.length > 1) {
      // More complex situations
      const { width, height } = resolveManualFigureSlot(
        indices,
        slots[1],
        grid,
        margin,
      );

      slot.width += width;
      slot.height += height;
    }
  } else {
    // Auto mode
    slot = { ...slots[figureIndex] };
    // If only one figure, take whole viewport
    if (figures.length === 1) {
      slot.width = viewport.width;
      slot.height = viewport.height;
    }

    // If no second row, take whole height
    if (figures.length <= slots.length - 2) {
      slot.height = viewport.height;
    }

    // If in penultimate slot and last figure, take whole remaining space
    if (figureIndex === slots.length - 2 && figureIndex === figures.length - 1) {
      slot.width += slots[figureIndex + 1].width + margin.horizontal;
    }
  }

  return {
    slot,
    figure,
  };
}
