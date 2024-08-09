import { existsSync } from 'node:fs';
import { readFile, stat, unlink } from 'node:fs/promises';

import { jsPDF as PDF } from 'jspdf';

import config from '~/lib/config';
import { appLogger as logger } from '~/lib/logger';
import { format, type Interval } from '~/lib/date-fns';

import { loadImageAsset, registerJSPDFFont } from './utils';

const { logos } = config.pdf;
const { fontFamily, fonts } = config.report;

// Register fonts
type JSPDFRegisterableFont = {
  path: string;
  family: string;
  weight?: string;
  style?: string
};

fonts.forEach(({ path, ...font }: JSPDFRegisterableFont) => {
  registerJSPDFFont(path, font).then(() => {
    logger.verbose(`[jspdf] Register font: [${path}] as [${font.family} ${font.weight || ''}${font.style || ''}]`);
  });
});

let doc: {
  // Calc at init
  /**
   * jsPDF instance
   */
  pdf: PDF;
  /**
   * Width of document in px
   */
  width: number;
  /**
   * Height of document in px
   */
  height: number;
  today: Date;
  /**
   * Offset is the margin (constant) + other PDF elements (like footer or header)
   */
  offset: {
    top: number;
    left: number;
    bottom: number;
    right: number;
  };
  fontFamily: string;

  // User defined
  /**
   * Output path
   */
  path: string;
  /**
   * Name of the report
   */
  name: string;
  period: Interval;

  // Constants
  /**
   * Margin between limit of the page & actual content
   */
  margin: {
    top: number;
    left: number;
    bottom: number;
    right: number;
  };
} | undefined;

export type PDFReport = Exclude<typeof doc, undefined>;

export type PDFReportOptions = Pick<PDFReport, 'name' | 'period' | 'path'>;

export type PDFStats = { pageCount: number, path: string, size: number };

/**
 * Print PDF's header
 *
 * @returns The total height of header with MARGIN
 */
const printHeader = async (): Promise<number> => {
  if (!doc) throw new Error('jsDoc not initialized');

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
      `du ${format(doc.period.start, 'dd/MM/yyyy')} au ${format(doc.period.end, 'dd/MM/yyyy')}`,
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
};

/**
 * Print PDF's footer
 *
 * @returns The total height of footer with margin
 */
const printFooter = async (): Promise<number> => {
  if (!doc) throw new Error('jsDoc not initialized');

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
};

/**
 * Init jsPDF & calculate some vars
 *
 * @param params Specific options
 */
export const initDoc = async (params: PDFReportOptions): Promise<PDFReport> => {
  const pdf = new PDF({
    unit: 'px',
    orientation: 'landscape',
    hotfixes: ['px_scaling'],
    compress: true,
  });
  doc = {
    ...params,
    pdf,
    width: pdf.internal.pageSize.getWidth(),
    height: pdf.internal.pageSize.getHeight(),
    today: new Date(),
    margin: {
      top: 30,
      right: 30,
      bottom: 30,
      left: 30,
    },
    fontFamily,
    // will calc later because we need doc instance
    offset: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  };
  doc.offset = {
    top: 5 + await printHeader(),
    right: doc.margin.right,
    bottom: 10 + await printFooter(),
    left: doc.margin.left,
  };
  return doc;
};

/**
 * Print page numbers, export PDF and reset document
 */
export const renderDoc = async (): Promise<PDFStats> => {
  if (!doc) throw new Error('jsDoc not initialized');

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
  const { path } = doc;
  await doc.pdf.save(path, { returnPromise: true });
  const { size } = await stat(path);

  doc = undefined;
  return {
    pageCount: totalPageCount,
    path,
    size,
  };
};

/**
 * Delete document if already exists
 */
export const deleteDoc = async (): Promise<void> => {
  if (doc && existsSync(doc.path)) await unlink(doc.path);
};

/**
 * Shorthand to add a page to the PDF with header + footer
 */
export const addPage = async (): Promise<void> => {
  if (!doc) throw new Error('jsDoc not initialized');

  doc.pdf.addPage();
  await printHeader();
  await printFooter();
};
