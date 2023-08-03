import { MdParser, type MdImgRemoteRequestor } from '@ezpaarse-project/jspdf-md';

import http from '~/lib/http-requests';
import type { PDFReport } from '~/lib/pdf';

type MdParams = {
  start: Position
  width: number,
  height: number
};

export type InputMdParams = Omit<MdParams, 'width' | 'height' | 'start'>;

const fetcher: MdImgRemoteRequestor = async (url, method) => {
  const { data, headers } = await http({
    method,
    url,
    responseType: 'arraybuffer',
  });

  return { data, headers: headers as Record<string, string> };
};

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
  const mdDoc = await (new MdParser(data)).parse();

  await mdDoc.loadImages(
    fetcher,
    'assets',
  );

  mdDoc.render(
    doc.pdf,
    { pageBreak: false },
    {
      x: params.start.x,
      y: params.start.y,
      width: params.width,
      height: params.height,
    },
  );
};
