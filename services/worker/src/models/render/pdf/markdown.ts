import {
  MdParser,
  type MdImgRemoteRequestor,
} from '@ezpaarse-project/jspdf-md';

import { http } from '~/lib/http-requests';
import { appLogger } from '~/lib/logger';

import type { Position } from '~/models/render/types';
import type { PDFReport } from '~/models/render/pdf/types';

type MdParams = {
  start: Position;
  width: number;
  height: number;
};

export type InputMdParams = Omit<MdParams, 'width' | 'height' | 'start'>;

const logger = appLogger.child({ scope: 'md-to-pdf' });

const mdLogger: Console = {
  ...console,
  debug: (msg, ...args) => logger.trace({ msg, args }),
  log: (msg, ...args) => logger.debug({ msg, args }),
  info: (msg, ...args) => logger.info({ msg, args }),
  warn: (msg, ...args) => logger.warn({ msg, args }),
  error: (msg, ...args) => logger.error({ msg, args }),
};

/**
 * The method used to fetch images
 *
 * @param url The url of the ressource
 * @param method The method used to get the ressource
 *
 * @returns The data fetched
 */
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
export const addMdToPDF = async (
  doc: PDFReport,
  data: string,
  params: MdParams
): Promise<void> => {
  const mdDoc = await new MdParser(data, mdLogger).parse();

  await mdDoc.loadImages(fetcher, 'assets');

  mdDoc.render(
    doc.pdf,
    { pageBreak: false },
    {
      // oxlint-disable-next-line id-length
      x: params.start.x,
      // oxlint-disable-next-line id-length
      y: params.start.y,
      width: params.width,
      height: params.height,
    }
  );
};
