import { compile as handlebars } from 'handlebars';
import autoTable, { type CellDef, type UserOptions } from 'jspdf-autotable';
import { get, merge } from 'lodash';

import { appLogger as logger } from '~/lib/logger';

import type { PDFReport } from '.';

export type TableParams = {
  title: string,
  dataKey?: string,
  maxLength?: number,
  maxHeight?: number,
  totals?: string[],
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
    maxLength,
    maxHeight,
    title,
    ...params
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

  const options = merge(
    {
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
    },
    params,
  );

  if (options.columns) {
    // Adding custom style to header
    options.columns = options.columns.map((col) => {
      if (
        typeof col !== 'object'
        || !col.header
        || Array.isArray(col.header)
      ) {
        return col;
      }

      let { header: colHeader } = col;
      if (typeof colHeader !== 'object') {
        colHeader = {
          content: col.header.toString(),
          styles: options.columnStyles?.[col.dataKey ?? ''],
        };
      }

      return {
        ...col,
        header: colHeader,
      };
    });

    // Adding totals as footer
    if (options.totals) {
      const totalSet = new Set(options.totals);
      options.foot = [
        options.columns.map((col): CellDef => {
          if (typeof col !== 'object' || !col.dataKey || !totalSet.has(col.dataKey.toString())) {
            return { content: '' };
          }

          return {
            content: tableData.reduce(
              (prev, d) => prev + Number.parseInt(get(d, col.dataKey?.toString() ?? '') ?? '0', 10),
              0,
            ),
            styles: options.columnStyles?.[col.dataKey],
          };
        }),
      ];
    }
  }

  const y = options.startY || options.margin.top;

  // Table title
  if (title) {
    doc.pdf
      .setFont('Roboto', 'bold')
      .setFontSize(fontSize)
      .text(
        handlebars(title)({ length: tableData.length }),
        options.margin.left,
        y - 0.5 * fontSize,
      );
  }

  // Print table
  autoTable(doc.pdf, {
    ...options,
    startY: y,
    body: tableData,
    didParseCell: (hookData) => {
      // If dataKey is a property path
      if (hookData.row.section === 'body') {
        let d = get(tableData[hookData.row.index], hookData.column.dataKey.toString()) ?? '';
        switch (typeof d) {
          default:
            d = d.toString();
            break;
        }
        // eslint-disable-next-line no-param-reassign
        hookData.cell.text = [d];
      }
    },
  });
};
