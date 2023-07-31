import type { jsPDF } from 'jspdf';

import type { MdDefault, MdRenderResult } from './MdElement';
import MdTextElement from './MdTextElement';

export default class MdStrongElement extends MdTextElement {
  constructor(
    content: string,
    private isItalic: boolean,
  ) {
    super(content);
  }

  render(
    pdf: jsPDF,
    def: MdDefault,
    start: Position,
    edge: Area,
  ): MdRenderResult {
    pdf.setFont(def.font.fontName, this.isItalic ? 'bolditalic' : 'bold');

    const rendered = super.render(pdf, def, start, edge);

    pdf.setFont(def.font.fontName, def.font.fontStyle);

    return rendered;
  }
}
