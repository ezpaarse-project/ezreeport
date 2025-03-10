import { existsSync } from 'node:fs';
import { readFile, stat, unlink } from 'node:fs/promises';

import { jsPDF as PDF } from 'jspdf';

import { format } from '~common/lib/date-fns';
import config from '~/lib/config';
import { appLogger } from '~/lib/logger';

import type {
  JSPDFRegisterableFont,
  PDFReportInit,
  PDFReport,
  PDFStats,
} from './types';

import { loadImageAsset, registerJSPDFFont } from './utils';

const { logos } = config.pdf;
const { fontFamily, fonts } = config.report;

const logger = appLogger.child({ scope: 'jspdf' });

export async function initPDFEngine() {
  // Register fonts
  return Promise.all(
    fonts.map(async ({ path, ...font }: JSPDFRegisterableFont) => {
      await registerJSPDFFont(path, font);
      logger.debug({
        path,
        font,
        msg: 'Registered font',
      });
    }),
  );
}

export type PDFReportOptions = Pick<PDFReportInit, 'name' | 'period' | 'path' | 'namespace'>;

/**
 * Print PDF's header
 *
 * @returns The total height of header with MARGIN
 */
async function printHeader(doc: PDFReportInit): Promise<number> {
  let fontSize = 13;
  // "cursor" that will help correct positioning
  let y = doc.margin.top + fontSize;
  doc.pdf
    .setFont(doc.fontFamily, 'bold')
    .setFontSize(fontSize)
    .text(doc.name, doc.margin.right, y);

  // Move "cursor" by 1 line (fontSize) + some space
  y += fontSize + 2;
  fontSize = 10;
  doc.pdf
    .setFont(doc.fontFamily, 'normal')
    .setTextColor('#000000')
    .setFontSize(fontSize)
    .text(
      `du ${format(doc.period.start, 'dd/MM/yyyy')} au ${format(doc.period.end, 'dd/MM/yyyy')}, pour ${doc.namespace.name}`,
      doc.margin.right,
      y,
    );

  // Move "cursor" by 2 lines (2*fontSize) + some space
  const cursorOffset = y + 2 * fontSize + 2;

  // Print first logo
  const logo = logos.at(0);
  if (!logo) {
    return cursorOffset;
  }

  const logoHeight = y - doc.margin.top; // Wanted height of logo
  const data = await readFile(logo.path, 'base64');
  const {
    data: imageData,
    height: rawHeight,
    width: rawWidth,
  } = await loadImageAsset(`data:image/png;base64,${data}`);

  // Scaling down logo while preserving aspect ratio
  const logoWidth = (logoHeight * rawWidth) / rawHeight;
  const logoX = doc.width - doc.margin.right - logoWidth;
  const logoY = doc.margin.top;
  doc.pdf
    .addImage({
      imageData,
      x: logoX,
      y: logoY,
      height: logoHeight,
      width: logoWidth,
    })
    .link(logoX, logoY, logoWidth, logoHeight, { url: logo.link });

  return cursorOffset;
}

/**
 * Print PDF's footer
 *
 * @returns The total height of footer with margin
 */
async function printFooter(doc: PDFReportInit): Promise<number> {
  const footerLogos = logos.slice(1);
  const imagesData = [] as { data: string, width: number, url: string }[];
  const height = 20; // Wanted height of logos
  const margin = 10;
  let totalWidth = 0;

  // Load images
  // eslint-disable-next-line no-restricted-syntax
  for (const logo of footerLogos) {
    // eslint-disable-next-line no-await-in-loop
    const data = await readFile(logo.path, 'base64');
    const {
      data: imageData,
      height: rawHeight,
      width: rawWidth,
    // eslint-disable-next-line no-await-in-loop
    } = await loadImageAsset(`data:image/png;base64,${data}`);
    // Scaling down logo while preserving aspect ratio
    const width = ((height * rawWidth) / rawHeight);
    totalWidth += width + margin;

    imagesData.push({
      data: imageData,
      width,
      url: logo.link,
    });
  }

  let x = (doc.width / 2) - (totalWidth / 2);
  const y = doc.height - doc.margin.bottom - height + 1;

  // Print image
  // eslint-disable-next-line no-restricted-syntax
  for (const img of imagesData) {
    doc.pdf
      .addImage({
        imageData: img.data,
        x,
        y,
        height,
        width: img.width,
      })
      .link(x, y, img.width, height, { url: img.url });

    x += img.width + margin;
  }

  // Page numbers are printed when rendering (because we don't know the total page count before)

  return doc.height - y + 2;
}

/**
 * Print page numbers, export PDF and reset document
 */
async function renderDoc(doc: PDFReportInit): Promise<PDFStats> {
  // Print page numbers
  const totalPageCount = doc.pdf.internal.pages.length - 1;
  for (let currPage = 1; currPage <= totalPageCount; currPage += 1) {
    doc.pdf.setPage(currPage);

    const x = doc.width - doc.margin.right;
    const y = doc.height - doc.margin.bottom;
    const pageNoText = `${currPage} / ${totalPageCount}`;
    const w = doc.pdf
      .setFont(doc.fontFamily, 'normal')
      .setTextColor('#000000')
      .setFontSize(13)
      .getTextWidth(pageNoText);

    doc.pdf
      .text(pageNoText, x, y - 3, { align: 'right' })
      .setFontSize(8)
      .text(
        `Généré le ${format(doc.today, 'dd/MM/yyyy')}`,
        x - w - 15,
        y - 5,
        { align: 'right' },
      );
  }

  // Export document
  await doc.pdf.save(doc.path, { returnPromise: true });
  const { size } = await stat(doc.path);

  return {
    pageCount: totalPageCount,
    path: doc.path,
    size,
  };
}

/**
 * Delete document if already exists
 */
async function deleteDoc(doc: PDFReportInit): Promise<void> {
  if (existsSync(doc.path)) {
    await unlink(doc.path);
  }
}

/**
 * Shorthand to add a page to the PDF with header + footer
 */
async function addDocPage(doc: PDFReportInit): Promise<void> {
  doc.pdf.addPage();
  await printHeader(doc);
  await printFooter(doc);
}

/**
 * Init jsPDF & calculate some vars
 *
 * @param params Specific options
 *
 * @returns The report
 */
export async function createPDF(params: PDFReportOptions): Promise<PDFReport> {
  const pdf = new PDF({
    unit: 'px',
    orientation: 'landscape',
    hotfixes: ['px_scaling'],
    compress: true,
  });

  const init: PDFReportInit = {
    ...params,
    pdf,
    width: pdf.internal.pageSize.getWidth(),
    height: pdf.internal.pageSize.getHeight(),
    today: new Date(),
    fontFamily,
    margin: {
      top: 30,
      right: 30,
      bottom: 30,
      left: 30,
    },
  };

  const doc: PDFReport = {
    ...init,
    offset: {
      top: 5 + await printHeader(init),
      right: init.margin.right,
      bottom: 10 + await printFooter(init),
      left: init.margin.left,
    },
    addPage() { return addDocPage(this); },
    render() { return renderDoc(this); },
    delete() { return deleteDoc(this); },
  };

  return doc;
}
