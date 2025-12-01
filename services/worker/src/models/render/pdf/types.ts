import type { jsPDF as PDF } from 'jspdf';

import type { Interval } from '@ezreeport/dates';

export type JSPDFRegisterableFont = {
  path: string;
  family: string;
  weight?: string;
  style?: string;
};

export type PDFReportInit = {
  /**
   * jsPDF instance
   */
  pdf: PDF;
  /**
   * Width of document in px
   */
  width: number;
  /**
   * Height of document in px
   */
  height: number;
  today: Date;
  fontFamily: string;
  /**
   * Name of the report
   */
  name: string;
  period: Interval;
  namespace: { name: string };
  /**
   * Margin between limit of the page & actual content
   */
  margin: {
    top: number;
    left: number;
    bottom: number;
    right: number;
  };
};

export type PDFReport = PDFReportInit & {
  /**
   * Offset is the margin (constant) + other PDF elements (like footer or header)
   */
  offset: {
    top: number;
    left: number;
    bottom: number;
    right: number;
  };

  /** Add a new page to the pdf */
  addPage: () => void;
  /** Render the document, further modification of the document is not allowed */
  render: () => PDFResult;
};

export type PDFResult = {
  pageCount: number;
  data: Buffer;
};
