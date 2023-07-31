import type { jsPDF } from 'jspdf';
import type { MdDefault, MdRenderResult, MdElement } from './MdElement';

import MdParagraphElement from './MdParagraphElement';

export default class MdLinkElement extends MdParagraphElement {
  constructor(
    private href: string,
    children: MdElement[] = [],
  ) {
    super(children);
  }

  render(
    pdf: jsPDF,
    def: MdDefault,
    start: Position,
    edge: Area,
  ): MdRenderResult {
    const gap = 3;

    pdf.setTextColor('blue');

    const rendered = super.render(
      pdf,
      def,
      start,
      edge,
    );

    pdf
      // Add underline // TODO: Support multi line
      .setDrawColor('blue')
      .line(
        start.x,
        start.y + rendered.lastLine.height + gap,
        start.x + rendered.lastLine.width,
        start.y + rendered.lastLine.height + gap,
      )
      // Reset style
      .setDrawColor(def.drawColor)
      .setTextColor(def.fontColor)
      // Add link
      .link(
        start.x,
        start.y,
        rendered.lastLine.width,
        rendered.lastLine.height + gap,
        { url: this.href },
      );

    return rendered;
  }
}
