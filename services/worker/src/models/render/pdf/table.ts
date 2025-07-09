import { compile as handlebars } from 'handlebars';
import * as AutoTable from 'jspdf-autotable';
import { merge } from 'lodash';

import { ensureInt } from '@ezreeport/models/lib/utils';
import { appLogger } from '~/lib/logger';

import type { FetchResultItem } from '~/models/fetch/results';
import type { PDFReport } from '~/models/render/pdf/types';

type TableColumn = {
  header: string,
  metric?: boolean,
  styles: Partial<AutoTable.Styles>,
};

export type TableParams = {
  tableWidth?: number,
  startY?: number,
  margin?: AutoTable.MarginPaddingInput,

  maxHeight?: number,

  title?: string,
  columns?: TableColumn[],
  total?: boolean,
};

const logger = appLogger.child({ scope: 'jspdf' });

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
  const columns = spec.columns ?? [];
  let startY = spec.startY ?? 0;

  let tableData = [...data];

  // Calc margin
  const margin = merge(
    {
      right: doc.margin.right,
      left: doc.margin.left,
      bottom: doc.offset.bottom,
      top: doc.offset.top,
    },
    spec.margin,
  );

  const fontSize = doc.pdf.getFontSize();
  const font = doc.pdf.getFont();

  let { maxHeight } = spec;
  const y = startY;
  const titleCoords = { x: margin.left, y };
  // Table title
  if (spec.title) {
    const textMaxWidth = typeof spec.tableWidth === 'number' ? spec.tableWidth : undefined;

    doc.pdf
      .setFont(doc.fontFamily, 'bold')
      .setFontSize(10);

    const { h } = doc.pdf.getTextDimensions(
      spec.title,
      { maxWidth: textMaxWidth },
    );

    titleCoords.y = y + h;

    startY = y + (1.25 * h);
    if (maxHeight != null && maxHeight > 0) {
      maxHeight -= (1.25 * h);
    }
  }

  if (maxHeight != null && maxHeight > 0) {
    // default height of a cell is 29
    // Removing header & some space
    const maxTableHeight = maxHeight - (2 * 29);
    const maxRows = Math.ceil(maxTableHeight / 29);
    if (tableData.length > maxRows) {
      logger.warn({
        msg: 'Reducing table length because table won\'t fit in slot',
        tableDataLength: tableData.length,
        maxRows,
      });
      tableData = tableData.slice(0, maxRows - (spec.total ? 1 : 0));
    }
  }

  if (spec.title) {
    const textMaxWidth = typeof spec.tableWidth === 'number' ? spec.tableWidth : undefined;

    const parsed = handlebars(spec.title)({ length: tableData.length });
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

  let foot: AutoTable.RowInput[] | undefined;
  if (spec.total) {
    foot = [
      columns.map((col): AutoTable.CellDef => {
        if (!col.metric) {
          return { content: '' };
        }
        return {
          content: tableData.reduce((prev, item) => prev + ensureInt(item.value), 0),
          styles: col.styles,
        };
      }),
    ];
  }

  // Print table
  AutoTable.autoTable(doc.pdf, {
    styles: {
      overflow: 'ellipsize',
      minCellWidth: 100,
    },
    rowPageBreak: 'avoid',
    tableWidth: spec.tableWidth,
    startY,
    margin,

    columns: columns.map((col) => ({
      header: {
        content: col.header.toString(),
        styles: col.styles,
      },
    })),

    body: tableData.map(
      (item): AutoTable.RowInput => columns.map(
        (col): AutoTable.CellDef => {
          let { value } = item;
          if (!col.metric) {
            value = item[col.header] ?? '';
          }
          return { content: `${value}`, styles: col.styles };
        },
      ),
    ),

    foot,
  });
};
