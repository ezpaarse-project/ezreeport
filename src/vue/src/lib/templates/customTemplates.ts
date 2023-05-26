import type { templates, tasks } from '@ezpaarse-project/ezreeport-sdk-js';
import { v4 as uuid } from 'uuid';

interface CustomProperties {
  _: {
    id: string
    valid: true | string,
  }
}

export type AnyCustomFigure = templates.Figure & CustomProperties;

export type CustomLayout = Omit<templates.Layout, 'figures'> & { figures: AnyCustomFigure[] } & CustomProperties;
type TaskLayout = templates.Layout & { at: number };
export type CustomTaskLayout = Omit<TaskLayout, 'figures'> & { figures: AnyCustomFigure[] } & CustomProperties;
type AnyLayout = templates.Layout & { at?: number };
export type AnyCustomLayout = Omit<AnyLayout, 'figures'> & { figures: AnyCustomFigure[] } & CustomProperties;

export type CustomTemplate = Omit<templates.FullTemplate['body'], 'layouts'> & { layouts: CustomLayout[] };
export type CustomTaskTemplate = Omit<tasks.FullTask['template'], 'inserts'> & { inserts?: CustomTaskLayout[] };
export type AnyCustomTemplate = CustomTemplate | CustomTaskTemplate;

/**
* Add additional data to correctly render
*
* @param value The base object
*/
export const addAdditionalData = <T>(value: T): T & CustomProperties => ({
  ...value,
  _: {
    id: uuid(),
    valid: true,
  },
});

/**
* Add additional data to layouts
*
* @param value The layouts
*/
export const addAdditionalDataToLayouts = <T extends (templates.Layout | TaskLayout)>(
  layouts: T[],
) => layouts.map(
    (l) => {
      const figures = l.figures.map(addAdditionalData);
      return {
        ...addAdditionalData(l),
        figures,
      };
    },
  );
