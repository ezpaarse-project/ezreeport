import { nanoid } from 'nanoid/non-secure';
import objectHash from 'object-hash';

import type { TemplateBodyLayout } from '~/modules/templates';
import {
  createFigureHelperFrom,
  figureHelperToJSON,
  type AnyFigureHelper,
} from '../figures';

export interface LayoutHelper {
  readonly id: string;
  figures: AnyFigureHelper[];
  readonly hash: string;
}

export function hashLayout(layout: LayoutHelper | TemplateBodyLayout): string {
  return objectHash({ figures: layout.figures });
}

export function createLayoutHelper(figures: AnyFigureHelper[]): LayoutHelper {
  const layout = {
    id: nanoid(),
    figures,
    hash: '',
  };

  layout.hash = hashLayout(layout);

  return layout;
}

export function createLayoutHelperFrom(
  layout: TemplateBodyLayout
): LayoutHelper {
  return createLayoutHelper(
    layout.figures.map((fig) => createFigureHelperFrom(fig))
  );
}

export function layoutHelperToJSON(layout: LayoutHelper): TemplateBodyLayout {
  return {
    figures: layout.figures.map((fig) => figureHelperToJSON(fig)),
  };
}
