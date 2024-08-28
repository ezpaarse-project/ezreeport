import { compile as handlebars } from 'handlebars';
import * as AutoTable from 'jspdf-autotable';
import { merge } from 'lodash';

import type { FetchResultItem } from '~/models/reports/fetch/results';
import { appLogger as logger } from '~/lib/logger';

import type { PDFReport } from '.';
import { ensureInt } from '../utils';

type TableColumn = {
  header: string,
  metric?: boolean,
  style: Partial<AutoTable.Styles>,
};

export type TableParams = {
  tableWidth?: number,
  startY?: number,
  margin?: AutoTable.MarginPaddingInput,

  maxLength?: number,
  maxHeight?: number,

  title?: string,
  columns?: TableColumn[],
  total?: boolean,
};

/**
 * Add table to PDF
 *
 * @param doc The PDF report
 * @param data The data
 * @param spec The params given to jspdf-autotable
 */
export const addTableToPDF = async (
  doc: PDFReport,
  data: FetchResultItem[],
  spec: TableParams,
): Promise<void> => {
  const {
    maxLength,
    title,
    ...params
  } = spec;

  // Limit data if needed
  let tableData = data.slice(0, maxLength);

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
    const rowCount = tableData.length + (params.total ? 1 : 0);
    if (rowCount > maxRows) {
      logger.warn(`[pdf] Reducing table length from ${tableData.length} to ${maxRows} because table won't fit in slot.`);
      tableData = tableData.slice(0, maxRows - (params.total ? 1 : 0));
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

  const columns = params.columns ?? [];

  // Print table
  AutoTable.default(doc.pdf, {
    styles: {
      overflow: 'ellipsize',
      minCellWidth: 100,
    },
    rowPageBreak: 'avoid',
    tableWidth: params.tableWidth,
    startY: params.startY,
    margin,

    columns: columns.map((col) => ({
      header: {
        content: col.header.toString(),
        styles: col.style,
      },
    })),

    body: columns.map((col): AutoTable.RowInput => tableData.map(
      (item): AutoTable.CellDef => {
        let { value } = item;
        if (!col.metric) {
          value = item[col.header] ?? '';
        }
        return { content: `${value}` };
      },
    )),

    foot: [
      columns.map((col): AutoTable.CellDef => {
        if (!col.metric) {
          return { content: '' };
        }
        return {
          content: tableData.reduce((prev, item) => prev + ensureInt(item.value), 0),
          styles: col.style,
        };
      }),
    ],
  });
};
