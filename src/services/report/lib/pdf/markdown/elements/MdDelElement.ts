import type { jsPDF } from 'jspdf';

import type { MdDefault, MdRenderResult } from './MdElement';
import MdParagraphElement from './MdParagraphElement';

export default class MdDelElement extends MdParagraphElement {
  render(
    pdf: jsPDF,
    def: MdDefault,
    start: Position,
    edge: Area,
  ): MdRenderResult {
    const rendered = super.render(
      pdf,
      def,
      start,
      edge,
    );

    const offsetTop = 3 * (rendered.lastLine.height / 4);
    // TODO: support multi lines
    pdf.line(
      start.x,
      start.y + offsetTop,
      start.x + rendered.width,
      start.y + offsetTop,
    );

    return rendered;
  }
}
