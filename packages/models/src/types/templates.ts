import { z } from '../lib/zod';

/**
 * Validation for a filter
 */
const BaseFilter = z.object({
  field: z.string().min(1).describe('Field to apply filter to'),

  value: z
    .string()
    .min(1)
    .or(z.array(z.string()).min(1))
    .optional()
    .describe(
      'Value to match, if an array is set data must match one of the values, if not set field must exist'
    ),
});

/**
 * Validation for a raw filter
 */
const RawFilter = z.object({
  raw: z
    .record(z.string(), z.record(z.string(), z.any()))
    .describe('DSL query to run'),
});

/**
 * Validation for a complete filter
 */
export const Filter = z
  .object({
    name: z.string().min(1).describe('Filter name'),

    isNot: z.boolean().optional().describe('Should invert filter'),
  })
  .and(BaseFilter.or(RawFilter));

/**
 * Type for a filter
 */
export type FilterType = z.infer<typeof Filter>;

/**
 * Validation for a figure raw aggregation
 */
export const RawFigureAgg = z.object({
  raw: z.record(z.string(), z.record(z.string(), z.any())),
});

/**
 * Type for a figure raw aggregation
 */
export type RawFigureAggType = z.infer<typeof RawFigureAgg>;

/**
 * Validation for a figure filters aggregation
 */
export const FiltersFigureAgg = z.object({
  type: z.literal('filters'),
  values: z.array(
    z.object({
      label: z.string(),
      filters: z.array(Filter),
    })
  ),
  missing: z.string().min(0).optional(),
});

/**
 * Type for a figure filters aggregation
 */
export type FiltersFigureAggType = z.infer<typeof FiltersFigureAgg>;

/**
 * Validation for a figure basic aggregation
 */
export const BasicFigureAgg = z.object({
  type: z.string().min(1),
  field: z.string().min(1),
  size: z.int().min(0).optional(),
  missing: z.string().min(0).optional(),
});

/**
 * Type for a figure basic aggregation
 */
export type BasicFigureAggType = z.infer<typeof BasicFigureAgg>;

/**
 * Validation for a figure aggregation
 */
export const FigureAgg = z
  .union([BasicFigureAgg, FiltersFigureAgg])
  .or(RawFigureAgg);
// z.discriminatedUnion('type', [BasicFigureAgg, FiltersFigureAgg]),

/**
 * Type for a figure aggregation
 */
export type FigureAggType = z.infer<typeof FigureAgg>;

/**
 * Validation for a figure
 */
export const Figure = z.object({
  type: z.string().min(1).describe('Figure type'),

  data: z
    .any()
    .optional()
    .describe('Figure data, only used for Markdown figures'),

  params: z
    .any()
    .optional()
    .describe('Figure params, not used for Markdown figures'),

  filters: z
    .array(Filter)
    .optional()
    .describe('Filters used when fetching data of this figure'),

  slots: z
    .array(z.int().min(0))
    .optional()
    .describe('Slots used by this figure'),
});

/**
 * Type for a figure
 */
export type FigureType = z.infer<typeof Figure>;

/**
 * Validation for a layout
 */
export const Layout = z.object({
  figures: z.array(Figure).min(1).describe('Figures used in this layout'),
});

/**
 * Type for a layout
 */
export type LayoutType = z.infer<typeof Layout>;

/**
 * Validation for a task layout
 */
export const TaskLayout = z.object({
  ...Layout.shape,

  at: z.int().min(0).describe('Position where to insert this layout'),
});

/**
 * Validation for the grid
 */
const TemplateBodyGrid = z.object({
  cols: z.int().min(1).describe('Number of columns'),

  rows: z.int().min(1).describe('Number of rows'),
});

/**
 * Type for the grid
 */
export type TemplateBodyGridType = z.infer<typeof TemplateBodyGrid>;

/**
 * Validation for the template body
 */
export const TemplateBody = z.object({
  version: z.int().min(1).optional().describe('Template version'),

  index: z
    .string()
    .min(1)
    .optional()
    .describe('Elastic index used to create template.'),

  dateField: z
    .string()
    .min(1)
    .describe('Date field of index used to generate report'),

  filters: z
    .array(Filter)
    .optional()
    .describe('Global filters used when fetching data'),

  layouts: z.array(Layout).describe('Layouts used when rendering data'),

  grid: TemplateBodyGrid.optional().describe(
    'Grid used when rendering data. Default: 2x2'
  ),
});

/**
 * Type for the template body
 */
export type TemplateBodyType = z.infer<typeof TemplateBody>;

/**
 * Validation for the template body of a task
 */
export const TaskTemplateBody = z.object({
  version: z.int().min(1).optional().describe('Template version'),

  index: z.string().min(1).describe('Index used to fetch data'),

  dateField: z
    .string()
    .optional()
    .describe('Date field of index used to generate template'),

  filters: z
    .array(Filter)
    .optional()
    .describe('Global filters used when fetching data'),

  inserts: z
    .array(TaskLayout)
    .optional()
    .describe(
      'Layouts used when rendering data, added to the ones from the template.'
    ),
});

/**
 * Type for the template body of a task
 */
export type TaskTemplateBodyType = z.infer<typeof TaskTemplateBody>;

/**
 * Validation for a template's tag
 */
export const TemplateTag = z.object({
  id: z.string().min(1).describe('Tag ID'),

  name: z.string().min(1).describe('Tag name'),

  color: z.string().nullish().describe('Tag color. Should be in hex format.'),
});

/**
 * Type for a template's tag
 */
export type TemplateTagType = z.infer<typeof TemplateTag>;

/**
 * Validation for a template
 */
export const Template = z.object({
  id: z.string().min(1).describe('Template ID'),

  name: z.string().min(1).describe('Template name'),

  body: TemplateBody.describe('Template body'),

  hidden: z
    .boolean()
    .default(false)
    .optional()
    .describe('If template is hidden to normal users'),

  createdAt: z.coerce.date().describe('Creation date'),

  updatedAt: z.coerce.date().nullable().describe('Last update date'),
});

/**
 * Type for a template
 */
export type TemplateType = z.infer<typeof Template>;
