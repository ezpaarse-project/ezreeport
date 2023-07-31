import type { jsPDF } from 'jspdf';

import { type MdDefault, MdElement, type MdRenderResult } from './MdElement';

export default class MdQuoteElement extends MdElement<undefined> {
  constructor() {
    super(undefined);
  }

  // eslint-disable-next-line class-methods-use-this
  render(
    pdf: jsPDF,
    def: MdDefault,
    start: Position,
    edge: Area,
  ): MdRenderResult {
    pdf
      .setDrawColor('lightgrey')
      .line(
        start.x,
        start.y,
        start.x + edge.width,
        start.y,
      )
      .setDrawColor(def.drawColor);

    const res = {
      width: edge.width,
      height: 1,
    };

    return {
      ...res,
      lastLine: res,
      isBlock: true,
    };
  }
}
