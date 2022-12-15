import { compile as handlebars } from 'handlebars';
import autoTable, { type UserOptions } from 'jspdf-autotable';
import { get, merge } from 'lodash';
import type { PDFReport } from '.';
import logger from '../logger';

export type TableParams = {
  title: string,
  dataKey?: string,
  maxLength?: number;
  maxHeight?: number;
} & Omit<UserOptions, 'body' | 'didParseCell' | 'willDrawCell' | 'didDrawCell' | 'didDrawPage'>;

/**
 * Add table to PDF
 *
 * @param doc The PDF report
 * @param data The data
 * @param spec The params given to jspdf-autotable
 */
export const addTableToPDF = async (
  doc: PDFReport,
  inputData: Record<string, any[]> | any[],
  spec: TableParams,
): Promise<void> => {
  let data = [];
  if (Array.isArray(inputData)) {
    data = inputData;
  } else {
    if (!spec.dataKey) {
      throw new Error('data is not iterable, and no "dataKey" is present');
    }
    data = inputData[spec.dataKey];
  }

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
      logger.warn(`[pdf] Reducing table length from ${tableData.length} to ${maxCells} because table won't fit in slot.`);
      tableData.length = maxCells;
    }
  }

  // console.log(
  //   JSON.stringify(
  //     tableData,
  //     undefined,
  //     2,
  //   ),
  // );

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

  const y = options.startY || options.margin.top;

  // Table title
  doc.pdf
    .setFont('Roboto', 'bold')
    .setFontSize(fontSize)
    .text(
      handlebars(title)({ length: tableData.length }),
      options.margin.left,
      y - 0.5 * fontSize,
    );

  // Print table
  autoTable(doc.pdf, {
    ...options,
    body: tableData,
    didParseCell: (hookData) => {
      // If dataKey is a property path
      if (
        hookData.row.section === 'body'
        && /^\S+\./i.test(hookData.column.dataKey.toString())
      ) {
        // eslint-disable-next-line no-param-reassign
        hookData.cell.text = [
          get(
            tableData[hookData.row.index],
            hookData.column.dataKey,
          ) ?? '',
        ];
      }
    },
  });
};
