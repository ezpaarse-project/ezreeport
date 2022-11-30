import type { Font } from 'jspdf';

type MetricParams = {
  start: Position,
  width: number,
};

export type InputMetricParams = Omit<MetricParams, 'width' | 'height' | 'start'>;

  key: string,
  value: number | string
};

type MetricDefault = {
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
 * Add metric figure to PDF
 *
 * @param doc The PDF report
 * @param params Other params
 */
  const def: MetricDefault = {
    font: doc.pdf.getFont(),
    fontSize: doc.pdf.getFontSize(),
  };

  const margin = { x: doc.margin.left, y: doc.margin.top, key: 3 };
  const cell: Size = { width: 0, height: 0 };
  // Calc size of each text + size of cell
  const data = rawData.map(({ key, value }) => {
    const str = value.toString();
    const sizes = {
      key: keyStyle(doc.pdf, def).getTextDimensions(key),
      value: valueStyle(doc.pdf, def).getTextDimensions(str),
    };
    cell.width = Math.max(cell.width, Math.max(sizes.key.w, sizes.value.w));
    cell.height = Math.max(cell.height, sizes.key.h + sizes.value.h + margin.key);
    return {
      key,
      value: str,
      sizes,
    };
  });

  const slots: Area[] = [];
  const cursor: Position = {
    x: 0,
    y: 0,
  };

  // Calc positions of cells
  const counts = { rows: 1, cols: 0 };
  for (let i = 0; i < data.length; i += 1) {
    if (cursor.x + cell.width >= params.width) {
      cursor.x = 0;
      cursor.y += cell.height + margin.y;
      counts.rows += 1;
    }

    const slot: Area = {
      ...cell,
      x: cursor.x,
      y: cursor.y,
    };

    cursor.x += cell.width + margin.x;

    slots.push(slot);
  }
  counts.cols = data.length / counts.rows;

  const totalSize: Size = {
    width: (counts.cols * cell.width) + ((counts.cols - 1) * margin.x),
    height: (counts.rows * cell.height) + ((counts.rows - 1) * margin.y),
  };

  const offset: Position = {
    x: params.start.x + (params.width / 2) - (totalSize.width / 2),
    y: params.start.y + (params.height / 2) - (totalSize.height / 2),
  };

  // Print data
  for (let i = 0; i < data.length; i += 1) {
    const { key, value, sizes } = data[i];
    const slot = {
      ...slots[i],
      x: offset.x + slots[i].x,
      y: offset.y + slots[i].y,
    };

    let y = slot.y + sizes.value.h - 5;
    valueStyle(doc.pdf, def).text(
      value,
      slot.x + Math.round(slot.width / 2),
      y,
      { align: 'center' },
    );
    y += sizes.key.h + margin.key;
    keyStyle(doc.pdf, def).text(
      key,
      slot.x + Math.round(slot.width / 2),
      y,
      { align: 'center' },
    );
  }

  // Reset colors/fonts before generating further pages
  doc.pdf
    .setFont(def.font.fontName, def.font.fontStyle)
    .setFontSize(def.fontSize);
};
