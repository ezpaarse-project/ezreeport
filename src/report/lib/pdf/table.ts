import autoTable, { type UserOptions } from 'jspdf-autotable';
import { merge } from 'lodash';
import type { PDFReport } from '.';
import logger from '../logger';

export type TableParams = {
  title: string | ((data: unknown[]) => string),
  maxLength?: number;
  maxHeight?: number;
} & Omit<UserOptions, 'body'>;

export type TableParamsFnc = (doc: PDFReport) => TableParams;

export const addTableToPDF = async (
  doc: PDFReport,
  data: any[],
  spec: TableParams,
): Promise<void> => {
  const {
    maxLength, maxHeight, title, ...params
  } = spec;
  const fontSize = 10;

  // Limit data if needed
  const tableData = [...data];
  if (maxLength != null && maxLength > 0 && tableData.length > maxLength) {
    tableData.length = maxLength;
  }

  if (maxHeight != null && maxHeight > 0) {
    // default height of a cell is 29
    // Removing title, header & some space
    const maxTableHeight = maxHeight - (1.5 * fontSize) - (2 * 29);
    const maxCells = Math.ceil(maxTableHeight / 29);
    if (tableData.length > maxCells) {
      // TODO[feat]: Message ?
      logger.warn(`[pdf] Reducing table length from ${tableData.length} to ${maxCells} because table won't fit in slot.`);
      tableData.length = maxCells;
    }
  }

  const options = merge({
    margin: {
      right: doc.margin.right,
      left: doc.margin.left,
      bottom: doc.offset.bottom,
      top: doc.offset.top + 2 * fontSize,
    },
    styles: {
      overflow: 'ellipsize',
      minCellWidth: 100,
    },
    rowPageBreak: 'avoid',
  }, params);

  const y = +(options.startY ?? 0) || options.margin.top;
  const t = typeof title === 'function' ? title(tableData) : title;

  // Table title
  doc.pdf
    .setFont('Roboto', 'bold')
    .setFontSize(fontSize)
    .text(t, options.margin.left, y - 0.5 * fontSize);

  // Print table
  autoTable(doc.pdf, {
    ...options,
    body: tableData,
  });
};
