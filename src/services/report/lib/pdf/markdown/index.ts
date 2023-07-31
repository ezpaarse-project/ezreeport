import type { PDFReport } from '~/lib/pdf';

import type { MdDefault } from './elements/MdElement';
import MdParser from './MdParser';

type MdParams = {
  start: Position
  width: number,
  height: number
};

export type InputMdParams = Omit<MdParams, 'width' | 'height' | 'start'>;

/**
 * Add text (as Markdown) to PDF
 *
 * @param doc The PDF report
 * @param data The data (the text to show)
 * @param params Other params
 */
// eslint-disable-next-line import/prefer-default-export
export const addMdToPDF = async (
  doc: PDFReport,
  data: string,
  params: MdParams,
) => {
  // Prepare MD
  const def: MdDefault = {
    cursor: { ...params.start },
    font: doc.pdf.getFont(),
    fontSize: doc.pdf.getFontSize(),
    fontColor: doc.pdf.getTextColor(),
    drawColor: doc.pdf.getDrawColor(),
  };

  const mdDoc = await (new MdParser(data)).parse();

  await mdDoc.loadImages();

  mdDoc.render(
    doc.pdf,
    def,
    params.start,
    {
      x: params.start.x,
      y: params.start.y,
      width: params.width,
      height: params.height,
    },
  );
};
