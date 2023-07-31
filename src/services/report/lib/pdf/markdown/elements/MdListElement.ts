import type { jsPDF } from 'jspdf';

import { type MdDefault, MdElement, type MdRenderResult } from './MdElement';
import MdListItemElement from './MdListItemElement';

export default class MdListElement extends MdElement {
  declare protected children: MdListItemElement[];

  protected marginBottom = 0;

  constructor(
    children: MdListItemElement[],
    private ordered: boolean,
    private start: number,
  ) {
    super(undefined, children);
  }

  private printOrderedBullet(
    pdf: jsPDF,
    paddingLeft: number,
    elHeight: number,
    id: number,
  ) {
    pdf
      .text(
        `${id}.`,
        this.cursor.x + (paddingLeft / 2),
        this.cursor.y + elHeight,
      );
  }

  private printUnorderedBullet(
    pdf: jsPDF,
    paddingLeft: number,
    elHeight: number,
    drawColor: string,
  ) {
    const bulletRadius = 3;

    pdf
      .setFillColor('black')
      .setDrawColor('black')
      .circle(
        this.cursor.x + (paddingLeft / 2),
        this.cursor.y + (elHeight / 2) + (bulletRadius / 2),
        bulletRadius,
        'F',
      )
      .setDrawColor(drawColor)
      .setFillColor(drawColor);
  }

  render(
    pdf: jsPDF,
    def: MdDefault,
    start: Position,
    edge: Area,
  ): MdRenderResult {
    // Setup default values needed at render
    this.cursor = { ...start };
    let lastLine: Size = { width: 0, height: 0 };
    const paddingLeft = 24;
    const gap = 3;

    for (let i = 0; i < this.children.length; i += 1) {
      const child = this.children[i];
      // Print content
      const rendered = child.render(
        pdf,
        def,
        {
          x: this.cursor.x + paddingLeft,
          y: this.cursor.y,
        },
        {
          x: this.cursor.x + paddingLeft,
          y: this.cursor.y,
          height: 0,
          width: edge.width - this.cursor.x - paddingLeft,
        },
      );

      // Print bullet
      if (this.ordered) {
        this.printOrderedBullet(
          pdf,
          paddingLeft,
          rendered.lastLine.height,
          this.start + i,
        );
      } else {
        this.printUnorderedBullet(
          pdf,
          paddingLeft,
          rendered.lastLine.height,
          def.drawColor,
        );
      }

      this.cursor.y += rendered.height + gap;
      lastLine = rendered.lastLine;
    }

    const res = {
      width: edge.width,
      height: this.cursor.y - start.y,
      lastLine,
      isBlock: true,
    };

    return res;
  }
}
