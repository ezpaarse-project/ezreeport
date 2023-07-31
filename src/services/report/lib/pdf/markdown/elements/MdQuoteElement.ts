import type { jsPDF } from 'jspdf';

import type { MdDefault, MdRenderResult } from './MdElement';
import MdParagraphElement from './MdParagraphElement';

export default class MdQuoteElement extends MdParagraphElement {
  render(
    pdf: jsPDF,
    def: MdDefault,
    start: Position,
    edge: Area,
  ): MdRenderResult {
    // TODO: Support nested
    const paddingLeft = 12;
    const barWidth = 3;

    const rendered = super.render(
      pdf,
      def,
      {
        x: start.x + paddingLeft,
        y: start.y,
      },
      {
        ...edge,
        x: edge.x + paddingLeft,
        width: edge.width - paddingLeft,
      },
    );

    pdf
      .setFillColor('lightgrey')
      .rect(
        start.x,
        start.y,
        barWidth,
        rendered.height,
        'F',
      )
      .setFillColor(def.drawColor);

    return {
      ...rendered,
      height: rendered.height + this.marginBottom, // ?
      isBlock: true,
    };
  }
}
