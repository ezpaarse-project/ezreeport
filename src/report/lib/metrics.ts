import type { Font } from 'jspdf';
import type { PDFReport } from './pdf';

export type MetricParams = {};

export type MetricData = {
  key: string,
  value: number | string
};

type MetricDefault = {
  cursor: Position,
  font: Font,
  fontSize: number
};

/**
 * Apply style for printing value
 *
 * @param pdf The pdf
 * @param def The default values of pdf
 *
 * @returns The pdf
 */
const valueStyle = (pdf: PDFReport['pdf'], def: MetricDefault): PDFReport['pdf'] => pdf
  .setFontSize(21)
  .setFont(def.font.fontName, 'bold');

/**
 * Apply style for printing key
 *
 * @param pdf The pdf
 * @param def The default values of pdf
 *
 * @returns The pdf
 */
const keyStyle = (pdf: PDFReport['pdf'], def: MetricDefault): PDFReport['pdf'] => pdf
  .setFontSize(14)
  .setFont(def.font.fontName, def.font.fontStyle);

/**
 * Add metric chart to PDF
 *
 * @param doc The PDF document
 * @param rawData The data
 * @param _params Other params
 */
export const addMetricToPDF = (doc: PDFReport, rawData: MetricData[], _params: MetricParams) => {
  const def: MetricDefault = {
    cursor: {
      x: 0, // will be calculated later
      y: 0, // will be calculated later
    },
    font: doc.pdf.getFont(),
    fontSize: doc.pdf.getFontSize(),
  };

  const margin = { x: doc.margin.left, y: 3 };
  // Calc size of each text
  const data = rawData.map(({ key, value }) => {
    const str = value.toString();
    const sizes = {
      key: keyStyle(doc.pdf, def).getTextDimensions(key),
      value: valueStyle(doc.pdf, def).getTextDimensions(str),
    };
    return {
      key,
      value: str,
      sizes,
    };
  });

  // Calc total area
  const totalSizes = data.reduce(
    // TODO[feat]: Break if too wide
    (total, { sizes }) => {
      const sumSizes = Object.values(sizes).reduce(
        // For each size of item
        (sum, { w, h }) => ({ w: Math.max(sum.w, w), h: sum.h + h }),
        { w: 0, h: 0 },
      );
      // For each item
      return {
        w: total.w + sumSizes.w + margin.x,
        h: Math.max(total.h, sumSizes.h) + margin.y,
      };
    },
    { w: 0, h: 0 },
  );

  //! Duplicate
  const viewport = {
    x: doc.margin.left,
    y: doc.offset.top,
    width: doc.width - doc.margin.left - doc.margin.right,
    height: doc.height - doc.offset.top - doc.offset.bottom,
  };

  // Set cursor to center the whole area
  const cursor: Position = {
    x: viewport.x + Math.round(viewport.width / 2) - Math.round(totalSizes.w / 2),
    y: viewport.y + Math.round(viewport.height / 2) - Math.round(totalSizes.h / 2),
  };
  def.cursor = { ...cursor };

  // eslint-disable-next-line no-restricted-syntax
  for (const { key, value, sizes } of data) {
    const str = value.toString();
    // Getting maximum width of key/value
    const width = Math.max(...Object.values(sizes).map(({ w }) => w));
    // const height = Object.values(sizes).reduce((sum, { h }) => sum + h, 0);

    cursor.y += sizes.value.h;
    valueStyle(doc.pdf, def).text(str, cursor.x + Math.round(width / 2), cursor.y, { align: 'center' });
    cursor.y += sizes.key.h + margin.y;
    keyStyle(doc.pdf, def).text(key, cursor.x + Math.round(width / 2), cursor.y, { align: 'center' });

    cursor.x += width + margin.x;
    cursor.y = def.cursor.y;
  }
};
