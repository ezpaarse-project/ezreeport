import type { jsPDF } from 'jspdf';

import type { MdElement, MdDefault, MdRenderResult } from './MdElement';
import MdParagraphElement from './MdParagraphElement';

export default class MdHeadingElement extends MdParagraphElement {
  protected marginBottom = 8;

  constructor(
    children: MdElement[],
    private level: 1 | 2 | 3 | 4 | 5 | 6,
  ) {
    super(children);
  }

  render(
    pdf: jsPDF,
    def: MdDefault,
    start: Position,
    edge: Area,
  ): MdRenderResult {
    const fontSize = 48 / this.level;
    pdf.setFontSize(fontSize);

    const rendered = super.render(
      pdf,
      def,
      start,
      edge,
    );

    pdf.setFontSize(def.fontSize);

    return rendered;
  }
}
