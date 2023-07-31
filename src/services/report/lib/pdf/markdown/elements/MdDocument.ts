import type jsPDF from 'jspdf';

import { MdDefault, MdElement, MdRenderResult } from './MdElement';
import type MdImgElement from './MdImgElement';

export default class MdDocument extends MdElement<undefined> {
  constructor(
    children: MdElement[],
    private imagesToLoad: MdImgElement['load'][] = [],
  ) {
    super(undefined, children);
  }

  loadImages() {
    return Promise.all(
      this.imagesToLoad.map((loader) => loader()),
    );
  }

  render(
    pdf: jsPDF,
    def: MdDefault,
    start: Position,
    edge: Area,
  ): MdRenderResult {
    // Setup default values needed at render
    this.cursor = { ...start };

    // eslint-disable-next-line no-restricted-syntax
    for (const child of this.children) {
      const { height } = child.render(
        pdf,
        def,
        {
          x: start.x,
          y: this.cursor.y,
        },
        edge,
      );

      this.cursor.y += height;
    }

    return {
      ...edge,
      lastLine: edge,
      isBlock: true,
    };
  }
}
