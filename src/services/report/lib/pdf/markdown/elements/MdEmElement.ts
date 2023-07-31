import type { jsPDF } from 'jspdf';

import type { MdDefault, MdRenderResult } from './MdElement';
import MdTextElement from './MdTextElement';

export default class MdEmElement extends MdTextElement {
  constructor(
    content: string,
    private isBold: boolean,
  ) {
    super(content);
  }

  render(
    pdf: jsPDF,
    def: MdDefault,
    start: Position,
    edge: Area,
  ): MdRenderResult {
    pdf.setFont(def.font.fontName, this.isBold ? 'bolditalic' : 'italic');

    const rendered = super.render(pdf, def, start, edge);

    pdf.setFont(def.font.fontName, def.font.fontStyle);

    return rendered;
  }
}
