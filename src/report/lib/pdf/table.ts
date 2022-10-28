import autoTable, { type UserOptions } from 'jspdf-autotable';
import { merge } from 'lodash';
import type { PDFReport } from '.';

export type TableParams = {
  title: string,
  maxLength?: number;
} & Omit<UserOptions, 'body'>;

export type TableParamsFnc = (doc: PDFReport) => TableParams;

export const addTable = async (
  doc: PDFReport,
  data: any,
  spec: TableParams | TableParamsFnc | Promisify<TableParamsFnc>,
): Promise<void> => {
  const { maxLength, title, ...params } = typeof spec === 'function'
    ? await spec(doc)
    : spec;

  // Table title
  const fontSize = 10;
  doc.pdf
    .setFont('Roboto', 'bold')
    .setFontSize(fontSize)
    .text(title, doc.margin.left, doc.offset.top);

  // Limit data if needed
  // ? Usefull since elastic can do it ?
  const tableData = [...data];
  if (maxLength != null && maxLength > 0) {
    tableData.length = maxLength;
  }

  const options: Omit<UserOptions, 'body'> = {
    margin: {
      right: doc.margin.right,
      left: doc.margin.left,
      bottom: doc.offset.bottom,
      top: doc.offset.top + fontSize,
    },
    styles: {
      overflow: 'ellipsize',
      minCellWidth: 100,
    },
    rowPageBreak: 'avoid',
  };
  // Print table
  autoTable(doc.pdf, {
    ...merge(options, params),
    body: tableData,
  });
};
