import { compile as handlebars } from 'handlebars';
import autoTable, { type CellDef, type UserOptions } from 'jspdf-autotable';
import { get, merge } from 'lodash';

import { appLogger as logger } from '~/lib/logger';

import type { PDFReport } from '.';

export type TableParams = {
  title?: string,
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
  let data = inputData as any[];
  if (!Array.isArray(inputData)) {
    if (!spec.dataKey) {
      throw new Error('data is not iterable, and no "dataKey" is present');
    }

    if (!Array.isArray(inputData[spec.dataKey])) {
      throw new Error(`data.${spec.dataKey} is not iterable`);
    }

    data = inputData[spec.dataKey];
  }

  const {
    maxLength,
    title,
    ...params
  } = spec;

  // Limit data if needed
  let tableData = data.slice(0, maxLength);

  // Sort data by last column dataKey
  const lastCol = params.columns?.at(-1);
  if (typeof lastCol === 'object' && lastCol?.dataKey) {
    const dK = lastCol.dataKey;
    tableData.sort((a, b) => {
      const aValue = get(a, dK);
      const bValue = get(b, dK);
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return bValue.localeCompare(aValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return bValue - aValue;
      }
      return 0;
    });
  }

  // Calc margin
  const margin = merge(
    {
      right: doc.margin.right,
      left: doc.margin.left,
      bottom: doc.offset.bottom,
      top: doc.offset.top,
    },
    params.margin,
  );

  const fontSize = doc.pdf.getFontSize();
  const font = doc.pdf.getFont();

  let { maxHeight } = spec;
  const y = params.startY || 0;
  const titleCoords = { x: margin.left, y };
  // Table title
  if (title) {
    const textMaxWidth = typeof params.tableWidth === 'number' ? params.tableWidth : undefined;

    doc.pdf
      .setFont(doc.fontFamily, 'bold')
      .setFontSize(10);

    const { h } = doc.pdf.getTextDimensions(
      title,
      { maxWidth: textMaxWidth },
    );

    titleCoords.y = y + h;

    params.startY = y + (1.25 * h);
    if (maxHeight != null && maxHeight > 0) {
      maxHeight -= (1.25 * h);
    }
  }

  if (maxHeight != null && maxHeight > 0) {
    // default height of a cell is 29
    // Removing header & some space
    const maxTableHeight = maxHeight - (2 * 29);
    const maxRows = Math.ceil(maxTableHeight / 29);
    const rowCount = tableData.length + (params.totals ? 1 : 0);
    if (rowCount > maxRows) {
      logger.warn(`[pdf] Reducing table length from ${tableData.length} to ${maxRows} because table won't fit in slot.`);
      tableData = tableData.slice(0, maxRows - (params.totals ? 1 : 0));
    }
  }

  if (title) {
    const textMaxWidth = typeof params.tableWidth === 'number' ? params.tableWidth : undefined;

    const parsed = handlebars(title)({ length: tableData.length });
    doc.pdf
      .text(
        parsed,
        titleCoords.x,
        titleCoords.y,
        { maxWidth: textMaxWidth },
      )
      .setFontSize(fontSize)
      .setFont(font.fontName, font.fontStyle);
  }

  const options = merge(
    {
      styles: {
        overflow: 'ellipsize',
        minCellWidth: 100,
      },
      rowPageBreak: 'avoid',
    },
    params,
    { margin },
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
    if ((options.totals?.length ?? 0) > 0) {
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

  // Print table
  autoTable(doc.pdf, {
    ...options,
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
