import { z, stringToBool } from '~/lib/zod';

import { Filter } from '~/models/reports/generation/fetch/filters';

/**
 * Validation for a figure
 */
export const Figure = z.object({
  type: z.string().min(1)
    .describe('Figure type'),

  data: z.any().optional()
    .describe('Figure data, only used for Markdown figures'),

  params: z.any().optional()
    .describe('Figure params, not used for Markdown figures'),

  filters: z.array(Filter).optional()
    .describe('Filters used when fetching data of this figure'),

  slots: z.array(z.number()).optional()
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
  figures: z.array(Figure).min(1)
    .describe('Figures used in this layout'),
});

/**
 * Type for a layout
 */
export type LayoutType = z.infer<typeof Layout>;

/**
 * Validation for a task layout
 */
export const TaskLayout = Layout.and(
  z.object({
    at: z.number().min(0)
      .describe('Position where to insert this layout'),
  }),
);

/**
 * Validation for the grid
 */
const TemplateBodyGrid = z.object({
  cols: z.number().min(1)
    .describe('Number of columns'),

  rows: z.number().min(1)
    .describe('Number of rows'),
});

/**
 * Type for the grid
 */
export type TemplateBodyGridType = z.infer<typeof TemplateBodyGrid>;

/**
 * Validation for the template body
 */
export const TemplateBody = z.object({
  version: z.number().min(1).optional()
    .describe('Template version'),

  index: z.string().min(1).optional()
    .describe('Elastic index used to create template.'),

  dateField: z.string().min(1)
    .describe('Date field of index used to generate report'),

  filters: z.array(Filter).optional()
    .describe('Global filters used when fetching data'),

  layouts: z.array(Layout)
    .describe('Layouts used when rendering data'),

  grid: TemplateBodyGrid.optional()
    .describe('Grid used when rendering data. Default: 2x2'),
});

/**
 * Type for the template body
 */
export type TemplateBodyType = z.infer<typeof TemplateBody>;

/**
 * Validation for the template body of a task
 */
export const TaskTemplateBody = z.object({
  version: z.number().min(1).optional()
    .describe('Template version'),

  index: z.string().min(1)
    .describe('Index used to fetch data'),

  dateField: z.string().optional()
    .describe('Date field of index used to generate template'),

  filters: z.array(Filter).optional()
    .describe('Global filters used when fetching data'),

  inserts: z.array(TaskLayout).optional()
    .describe('Layouts used when rendering data, added to the ones from the template.'),
});

/**
 * Type for the template body of a task
 */
export type TaskTemplateBodyType = z.infer<typeof TaskTemplateBody>;

/**
 * Validation for a template's tag
 */
export const TemplateTag = z.object({
  name: z.string().min(1)
    .describe('Tag name'),

  color: z.string().optional()
    .describe('Tag color. Should be in hex format.'),
});

/**
 * Type for a template's tag
 */
export type TemplateTagType = z.infer<typeof TemplateTag>;

/**
 * Validation for a template
 */
export const Template = z.object({
  id: z.string().min(1).readonly()
    .describe('Template ID'),

  name: z.string().min(1)
    .describe('Template name'),

  body: TemplateBody
    .describe('Template body'),

  tags: z.array(TemplateTag).optional()
    .describe('Template tags'),

  hidden: z.boolean().default(false).optional()
    .describe('If template is hidden to normal users'),

  createdAt: z.date().readonly()
    .describe('Creation date'),

  updatedAt: z.date().nullable().readonly()
    .describe('Last update date'),
});

/**
 * Type for a template
 */
export type TemplateType = z.infer<typeof Template>;

/**
 * Validation for creating/updating a template
 */
export const InputTemplate = Template.omit({
  // Stripping readonly properties
  id: true,
  createdAt: true,
  updatedAt: true,
}).strict();

/**
 * Type for creating/updating a template
 */
export type InputTemplateType = z.infer<typeof InputTemplate>;

/**
 * Validation for query filters of a template
 */
export const TemplateQueryFilters = z.object({
  query: z.string().optional()
    .describe('Query used for searching'),

  hidden: stringToBool.optional()
    .describe('If preset or template is hidden to normal users'),
});

/**
 * Type for query filters of a template
 */
export type TemplateQueryFiltersType = z.infer<typeof TemplateQueryFilters>;
