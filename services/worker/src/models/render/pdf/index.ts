import { readFile } from 'node:fs/promises';

import { jsPDF as PDF } from 'jspdf';

import { format } from '@ezreeport/dates';
import config from '~/lib/config';
import { appLogger } from '~/lib/logger';

import type {
  JSPDFRegisterableFont,
  PDFReportInit,
  PDFReport,
  PDFResult,
} from './types';

import {
  type PDFLoadedImageAsset,
  loadImageAsset,
  registerJSPDFFont,
} from './utils';

const { logos } = config.pdf;
const { fontFamily, fonts } = config.report;

type PDFAsset = (typeof logos)[number];

export type PDFReportOptions = Pick<
  PDFReportInit,
  'name' | 'period' | 'namespace'
>;

const logger = appLogger.child({ scope: 'jspdf' });

const loadedImages = new Map<string, PDFAsset & PDFLoadedImageAsset>();

/**
 * Load asset by reading file and storing it into RAM
 *
 * @param asset The asset to load
 */
async function loadImage({ path, link }: PDFAsset): Promise<void> {
  const data = await readFile(path, 'base64');
  const asset = await loadImageAsset(`data:image/png;base64,${data}`);

  loadedImages.set(path, {
    ...asset,
    path,
    link,
  });

  logger.debug({
    path,
    link,
    msg: 'Loaded image',
  });
}

/**
 * Load font by registering into jsPDF VFS
 *
 * @param font The font to load
 */
async function loadPDFFont({
  path,
  ...font
}: JSPDFRegisterableFont): Promise<void> {
  await registerJSPDFFont(path, font);

  logger.debug({
    path,
    font,
    msg: 'Registered font',
  });
}

/**
 * Initialize PDF engine by loading needed assets
 */
export function initPDFEngine(): Promise<void[]> {
  // oxlint-disable-next-line prefer-await-to-then
  return Promise.all([
    // Load logos
    ...logos.map(loadImage),
    // Register fonts
    ...fonts.map(loadPDFFont),
  ]);
}

/**
 * Print PDF's header
 *
 * @returns The total height of header with MARGIN
 */
function printHeader(doc: PDFReportInit): number {
  let fontSize = 13;
  // "cursor" that will help correct positioning
  let yPos = doc.margin.top + fontSize;
  doc.pdf
    .setFont(doc.fontFamily, 'bold')
    .setFontSize(fontSize)
    .text(doc.name, doc.margin.right, yPos);

  // Move "cursor" by 1 line (fontSize) + some space
  yPos += fontSize + 2;
  fontSize = 10;
  doc.pdf
    .setFont(doc.fontFamily, 'normal')
    .setTextColor('#000000')
    .setFontSize(fontSize)
    .text(
      `du ${format(doc.period.start, 'dd/MM/yyyy')} au ${format(doc.period.end, 'dd/MM/yyyy')}, pour ${doc.namespace.name}`,
      doc.margin.right,
      yPos
    );

  // Move "cursor" by 2 lines (2*fontSize) + some space
  const cursorOffset = yPos + 2 * fontSize + 2;

  // Print first logo
  const logo = loadedImages.get(logos.at(0)?.path || '');
  if (!logo) {
    return cursorOffset;
  }

  // Scaling down logo while preserving aspect ratio
  const logoHeight = Math.max(1, yPos - doc.margin.top); // Wanted height of logo
  const logoWidth = (logoHeight * logo.width) / logo.height;
  const logoX = doc.width - doc.margin.right - logoWidth;
  const logoY = doc.margin.top;
  doc.pdf
    .addImage({
      imageData: logo.data,
      // oxlint-disable-next-line id-length
      x: logoX,
      // oxlint-disable-next-line id-length
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
function printFooter(doc: PDFReportInit): number {
  const height = 20; // Wanted height of logos
  const margin = 10;

  let xPos = doc.width / 2;
  const yPos = doc.height - doc.margin.bottom - height + 1;

  // Print image
  for (const { path } of logos.slice(1)) {
    const asset = loadedImages.get(path);
    if (!asset) {
      continue;
    }

    // Scaling down logo while preserving aspect ratio
    const width = (height * asset.width) / Math.max(1, asset.height);

    doc.pdf
      .addImage({
        imageData: asset.data,
        // oxlint-disable-next-line id-length
        x: xPos,
        // oxlint-disable-next-line id-length
        y: yPos,
        height,
        width,
      })
      .link(xPos, yPos, width, height, { url: asset.link });

    xPos += asset.width + margin;
  }

  // Page numbers are printed when rendering (because we don't know the total page count before)

  return doc.height - yPos + 2;
}

/**
 * Print page numbers, export PDF and reset document
 */
function renderDoc(doc: PDFReportInit): PDFResult {
  // Print page numbers
  const totalPageCount = doc.pdf.internal.pages.length - 1;
  for (let currPage = 1; currPage <= totalPageCount; currPage += 1) {
    doc.pdf.setPage(currPage);

    const xPos = doc.width - doc.margin.right;
    const yPos = doc.height - doc.margin.bottom;
    const pageNoText = `${currPage} / ${totalPageCount}`;
    const width = doc.pdf
      .setFont(doc.fontFamily, 'normal')
      .setTextColor('#000000')
      .setFontSize(13)
      .getTextWidth(pageNoText);

    doc.pdf
      .text(pageNoText, xPos, yPos - 3, { align: 'right' })
      .setFontSize(8)
      .text(
        `Généré le ${format(doc.today, 'dd/MM/yyyy')}`,
        xPos - width - 15,
        yPos - 5,
        {
          align: 'right',
        }
      );
  }

  // Export document
  const data = doc.pdf.output('arraybuffer');

  return {
    pageCount: totalPageCount,
    data: Buffer.from(data),
  };
}
/**
 * Shorthand to add a page to the PDF with header + footer
 */
function addDocPage(doc: PDFReportInit): void {
  doc.pdf.addPage();
  printHeader(doc);
  printFooter(doc);
}

/**
 * Init jsPDF & calculate some vars
 *
 * @param params Specific options
 *
 * @returns The report
 */
export function createPDF(params: PDFReportOptions): PDFReport {
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
      top: 5 + printHeader(init),
      right: init.margin.right,
      bottom: 10 + printFooter(init),
      left: init.margin.left,
    },
    addPage() {
      return addDocPage(this);
    },
    render() {
      return renderDoc(this);
    },
  };

  return doc;
}
