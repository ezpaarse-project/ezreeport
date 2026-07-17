import { readFile } from 'node:fs/promises';

import { jsPDF as PDF } from 'jspdf';

import { d, t } from '@ezreeport/i18n';

import config from '~/lib/config';
import { appLogger } from '~/lib/logger';

import type {
  JSPDFRegisterableFont,
  PDFReport,
  PDFReportInit,
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
  'name' | 'period' | 'namespace' | 'locale'
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
    link,
    path,
  });

  logger.debug({
    link,
    msg: 'Loaded image',
    path,
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
    font,
    msg: 'Registered font',
    path,
  });
}

/**
 * Initialize PDF engine by loading needed assets
 *
 * @returns Promise resolving when engine is ready
 */
export async function initPDFEngine(): Promise<void> {
  // oxlint-disable-next-line prefer-await-to-then
  await Promise.all([
    // Load logos
    ...logos.map((asset) => loadImage(asset)),
    // Register fonts
    ...fonts.map((asset) => loadPDFFont(asset)),
  ]);
}

/**
 * Print PDF's header's subtitle
 *
 * @param doc - The PDF document
 *
 * @returns The total height of footer with margin
 */
function printHeaderSubtitle(doc: PDFReportInit): number {
  const { period, locale } = doc;
  const subtitle = t('report.header.subtitle', locale, {
    namespace: doc.namespace.name,
    periodEnd: d(period.end, locale, 'P'),
    periodStart: d(period.start, locale, 'P'),
  });

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
    .text(subtitle, doc.margin.right, yPos);

  // Move "cursor" by 2 lines (2*fontSize) + some space
  return yPos + 2 * fontSize + 2;
}

/**
 * Print PDF's header's logos
 *
 * @param doc - The PDF document
 */
function printHeaderLogos(doc: PDFReportInit): void {
  // Print first logo
  const logo = loadedImages.get(logos.at(0)?.path || '');
  if (!logo) {
    return;
  }

  const fontSize = 13;
  // "cursor" that will help correct positioning - based on subtitle
  const yPos = doc.margin.top + 2 * fontSize + 2;

  // Scaling down logo while preserving aspect ratio
  const logoHeight = Math.max(1, yPos - doc.margin.top);
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
}

/**
 * Print PDF's header
 *
 * @param doc The PDF document
 *
 * @returns The total height of header with MARGIN
 */
function printHeader(doc: PDFReportInit): number {
  const offset = printHeaderSubtitle(doc);
  printHeaderLogos(doc);
  return offset;
}

/**
 * Print PDF's footer
 *
 * @param doc The PDF document
 *
 * @returns The total height of footer with margin
 */
function printFooter(doc: PDFReportInit): number {
  // Wanted height of logos
  const height = 20;
  const margin = 10;

  // Get assets of logos and scale down
  const assets = [];
  let assetsWidth = 0;
  // Skip first item as header already prints it
  for (const { path } of logos.slice(1)) {
    const asset = loadedImages.get(path);
    if (!asset) {
      continue;
    }

    // Scaling down logo while preserving aspect ratio
    const width = (height * asset.width) / Math.max(1, asset.height);
    assetsWidth += width;

    assets.push({ ...asset, height, width });
  }

  // Align logos to the bottom center
  let xPos = doc.width / 2 - assetsWidth / 2;
  const yPos = doc.height - doc.margin.bottom - height + 1;

  // Print images
  for (const asset of assets) {
    doc.pdf
      .addImage({
        imageData: asset.data,
        // oxlint-disable-next-line id-length
        x: xPos,
        // oxlint-disable-next-line id-length
        y: yPos,
        height: asset.height,
        width: asset.width,
      })
      .link(xPos, yPos, asset.width, asset.height, { url: asset.link });

    xPos += asset.width + margin;
  }

  // Page numbers are printed when rendering (because we don't know the total page count before)

  return doc.height - yPos + 2;
}

/**
 * Print page numbers, export PDF and reset document
 *
 * @param doc The PDF document
 *
 * @returns Rendered PDF document
 */
function renderDoc(doc: PDFReportInit): PDFResult {
  const createdAt = t('report.footer.createdAt', doc.locale, {
    date: d(doc.today, doc.locale, 'P'),
  });

  const xPos = doc.width - doc.margin.right;
  const yPos = doc.height - doc.margin.bottom;

  doc.pdf.setFont(doc.fontFamily, 'normal').setTextColor('#000000');

  // Print page numbers
  const totalPageCount = doc.pdf.internal.pages.length - 1;

  for (let currPage = 1; currPage <= totalPageCount; currPage += 1) {
    doc.pdf.setPage(currPage);

    const pageNoText = `${currPage} / ${totalPageCount}`;
    const width = doc.pdf.setFontSize(13).getTextWidth(pageNoText);

    doc.pdf
      .text(pageNoText, xPos, yPos - 3, { align: 'right' })
      .setFontSize(8)
      .text(createdAt, xPos - width - 15, yPos - 5, {
        align: 'right',
      });
  }

  // Export document
  const data = doc.pdf.output('arraybuffer');

  return {
    data: Buffer.from(data),
    pageCount: totalPageCount,
  };
}
/**
 * Shorthand to add a page to the PDF with header + footer
 *
 * @param doc The PDF document
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
    compress: true,
    hotfixes: ['px_scaling'],
    orientation: 'landscape',
    unit: 'px',
  });

  const init: PDFReportInit = {
    ...params,
    fontFamily,
    height: pdf.internal.pageSize.getHeight(),
    margin: {
      bottom: 30,
      left: 30,
      right: 30,
      top: 30,
    },
    pdf,
    today: new Date(),
    width: pdf.internal.pageSize.getWidth(),
  };

  const doc: PDFReport = {
    ...init,
    addPage() {
      return addDocPage(this);
    },
    offset: {
      bottom: 10 + printFooter(init),
      left: init.margin.left,
      right: init.margin.right,
      top: 5 + printHeader(init),
    },
    render() {
      return renderDoc(this);
    },
  };

  return doc;
}
