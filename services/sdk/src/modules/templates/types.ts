export interface TemplateBasicFilter {
  /** Filter name */
  name: string;
  /** Should invert filter */
  isNot?: boolean;
  /** Field to apply filter to */
  field: string;
  /** Value(s) to match, if not provided, field must exist */
  value?: string | string[];
}

export interface TemplateRawFilter {
  /** Filter name */
  name: string;
  /** Should invert filter */
  isNot?: boolean;
  /** Raw DSL filter */
  raw: Record<string, unknown>;
}

/**
 * A filter of a template
 */
export type TemplateFilter = TemplateBasicFilter | TemplateRawFilter;

/**
 * A figure of a layout
 */
export interface TemplateBodyFigure {
  /** Figure type */
  type: string;
  /** Figure data, only used for Markdown figures */
  data?: unknown;
  /** Figure params, not used for Markdown figures */
  params?: any;
  /** Filters used when fetching data of this figure */
  filters?: TemplateFilter[];
  /** Slots used by this figure */
  slots: number[];
}

/**
 * Layout of a template
 */
export interface TemplateBodyLayout {
  /** Figures used in this layout */
  figures: TemplateBodyFigure[];
}

/**
 * Grid of a template
 */
export interface TemplateBodyGrid {
  /** Number of rows */
  rows: number;
  /** Number of columns */
  cols: number;
}

/**
 * Body of a template, this is the data used for generation
 */
export interface TemplateBody {
  /** Template version */
  version?: number;
  /** Elastic index used to create template. */
  index?: string;
  /** Date field of index used to generate report */
  dateField: string;
  /** Global filters used when fetching data */
  filters?: TemplateFilter[];
  /** Layouts used when rendering data */
  layouts: TemplateBodyLayout[];
  /** Grid used when rendering data. Default: 2x2 */
  grid?: TemplateBodyGrid;
}

/**
 * Tag of a template
 */
export interface TemplateTag {
  /** Tag name */
  name: string;
  /** Tag color. Should be in hex format */
  color?: string;
}

export interface Template {
  /** Template ID */
  id: string;
  /** Template name */
  name: string;
  /** Template body */
  body: TemplateBody;
  /** Template tags */
  tags?: TemplateTag[];
  /** If template is hidden to normal users */
  hidden?: boolean;
  /** Creation date */
  createdAt: Date;
  /** Last update date */
  updatedAt?: Date;
}

/**
 * Template in raw format
 */
export interface RawTemplate extends Omit<Template, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt?: string | null;
}

/**
 * Data needed to create/edit a template
 */
export type InputTemplate = Omit<Template, 'id' | 'createdAt' | 'updatedAt'>;
