import { jsPDF as PDF } from 'jspdf';
import { existsSync } from 'node:fs';
import { readFile, stat, unlink } from 'node:fs/promises';
import config from '~/lib/config';
import { format } from '~/lib/date-fns';
import './fonts/Roboto-bold.js';
import './fonts/Roboto-bolditalic.js';
import './fonts/Roboto-italic.js';
import './fonts/Roboto-normal.js';
import { loadImageAsset } from './utils';

const { logos } = config.get('pdf');

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
const printHeader = (): number => {
  if (!doc) throw new Error('jsDoc not initialized');

  let fontSize = 13;
  // "cursor" that will help correct positioning
  let y = doc.margin.top + fontSize;
  doc.pdf
    .setFont('Roboto', 'bold')
    .setFontSize(fontSize)
    .text(doc.name, doc.width / 2, y, { align: 'center' });

  // Move "cursor" by 1 line (fontSize) + some space
  y += fontSize + 2;
  fontSize = 10;
  doc.pdf
    .setFont('Roboto', 'normal')
    .setTextColor('#000000')
    .setFontSize(fontSize)
    .text(
      [
        `Rapport couvrant la période du ${format(
          doc.period.start,
          'dd/MM/yyyy, HH:mm',
        )} au ${format(doc.period.end, 'dd/MM/yyyy, HH:mm')}`,
        `Généré le ${format(doc.today, 'EEEE dd MMMM yyyy')}`,
      ],
      doc.width / 2,
      y,
      { align: 'center' },
    );

  // Move "cursor" by 2 lines (2*fontSize) + some space
  return y + 2 * fontSize + 2;
};

/**
 * Print PDF's footer
 *
 * @returns The total height of footer with margin
 */
const printFooter = async (): Promise<number> => {
  if (!doc) throw new Error('jsDoc not initialized');

  const y = doc.height - doc.margin.bottom;
  let x = doc.margin.left;
  let minY = y;

  const height = 30; // Wanted height of logos
  // eslint-disable-next-line no-restricted-syntax
  for (const { path, link: url } of logos) {
    // eslint-disable-next-line no-await-in-loop
    const data = await readFile(path, 'base64');
    const {
      data: imageData,
      height: rawHeight,
      width: rawWidth,
      // eslint-disable-next-line no-await-in-loop
    } = await loadImageAsset(`data:image/png;base64,${data}`);
    // Scaling down logo while preserving aspect ratio
    const width = (height * rawWidth) / rawHeight;

    const imgY = y - height / 1.75;
    if (imgY < minY) minY = imgY;

    doc.pdf
      .addImage({
        imageData,
        x,
        y: imgY,
        height,
        width,
      })
      .link(x, imgY, width, height, { url });
    x += width + 5;
  }

  // Page numbers are printed when rendering (because we don't know the total page count before)

  return doc.height - minY + 2;
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
    // will calc later because we need doc instance
    offset: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  };
  doc.offset = {
    top: 5 + printHeader(),
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
    doc.pdf
      .setFont('Roboto', 'normal')
      .setTextColor('#000000')
      .setFontSize(8)
      .text(
        `${currPage} / ${totalPageCount}`,
        doc.width - doc.margin.right,
        doc.height - doc.margin.bottom + 1.05,
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
  printHeader();
  await printFooter();
};
