export interface ReportFiles {
  /** File containing details about the generation of report */
  detail: string;
  /** File containing the report */
  report?: string;
}

export interface ReportPeriod {
  /** Start of the period */
  start: Date;
  /** End of the period */
  end: Date;
}

export interface RawReportPeriod {
  start: string;
  end: string;
}

export interface ReportStats {
  /** Number of page in the report */
  pageCount: number;
  /** Size of the report */
  size: number;
}

export interface ReportErrorCause {
  /** Where the error occurred */
  type: string;
  /** Layout number where error occurred */
  layout: number;
  /** Figure number where error occurred */
  figure?: string | number;
}

export interface ReportDetails {
  /** Creation date of the report */
  createdAt: Date;
  /** Date when the report will be destroyed */
  destroyAt: Date;
  /** Time taken to generate the report */
  took: number;
  /** Task ID used to generate the report */
  taskId: string;
  /** Email addresses the report was sent */
  sendingTo?: string[];
  /** Period used to generate report */
  period?: ReportPeriod;
  files: ReportFiles;
  /** Auth used to generate the report */
  auth: {
    elastic: {
      /** Elastic username used to fetch data */
      username: string;
    }
  }
  /** Stats about the report */
  stats?: ReportStats;
  /** Error details */
  error?: {
    /** Error message */
    message: string;
    /** Error cause */
    cause?: ReportErrorCause;
  }
  /** Meta data */
  meta?: unknown;
}

export interface RawReportDetails extends Omit<ReportDetails, 'period' | 'createdAt' | 'destroyAt'> {
  createdAt: string;
  destroyAt: string;
  period?: RawReportPeriod;
}

export interface ReportResult {
  /** Whether the report was successfully generated */
  success: boolean;
  /** Details */
  detail: ReportDetails
}

export interface RawReportResult extends Omit<ReportResult, 'detail'> {
  detail: RawReportDetails
}
