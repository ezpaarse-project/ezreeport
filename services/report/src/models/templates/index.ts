import prisma, { type Prisma } from '~/lib/prisma';
import config from '~/lib/config';
import { appLogger } from '~/lib/logger';
import { ensureSchema } from '~/lib/zod';

import type { PaginationType } from '~/models/pagination/types';
import { buildPaginatedRequest } from '~/models/pagination';

import {
  Template,
  type TemplateType,
  type InputTemplateType,
  type TemplateQueryFiltersType,
} from './types';

const { defaultTemplate } = config;

const logger = appLogger.child({ scope: 'models', model: 'templates' });

function applyFilters(filters: TemplateQueryFiltersType) {
  const where: Prisma.TemplateWhereInput = {};

  if (filters.hidden != null) {
    where.hidden = filters.hidden;
  }

  if (filters.query) {
    where.name = { contains: filters.query, mode: 'insensitive' as Prisma.QueryMode };
  }

  return where;
}

/**
 * Get all templates
 *
 * @param pagination Pagination options
 *
 * @returns All templates following pagination
 */
export async function getAllTemplates(
  filters?: TemplateQueryFiltersType,
  pagination?: PaginationType,
): Promise<TemplateType[]> {
  // Prepare Prisma query
  const prismaQuery: Prisma.TemplateFindManyArgs = buildPaginatedRequest(pagination);

  // Apply filters
  if (filters) {
    prismaQuery.where = applyFilters(filters);
  }

  // Fetch data
  const data = await prisma.template.findMany(prismaQuery);

  // Ensure data
  const templates = await Promise.all(
    data.map((template) => ensureSchema(Template, template, (t) => `Failed to parse template ${t.id}`)),
  );
  return templates;
}

/**
 * Get one template
 *
 * @param id The template's id
 *
 * @returns The found template, or `null` if not found
 */
export async function getTemplate(id: string): Promise<TemplateType | null> {
  const template = await prisma.template.findUnique({ where: { id } });

  return template && ensureSchema(Template, template);
}

/**
 * Create a new template, throws if constraint is broken
 *
 * @param data The template's data
 *
 * @returns The created template
 */
export async function createTemplate(data: InputTemplateType): Promise<TemplateType> {
  const template = await prisma.template.create({ data });

  logger.debug({
    id: template.id,
    action: 'Created',
    msg: 'Created',
  });

  return ensureSchema(Template, template);
}

/**
 * Edit a template, throws if template doesn't exists or if constraint is broken
 *
 * @param id Template's id
 * @param data The template's data
 *
 * @returns The edited template
 */
export async function editTemplate(id: string, data: InputTemplateType): Promise<TemplateType> {
  const template = await prisma.template.update({ where: { id }, data });

  logger.debug({
    id: template.id,
    action: 'Updated',
    msg: 'Updated',
  });

  return ensureSchema(Template, template);
}

/**
 * Delete a template, throws if template doesn't exists
 *
 * @param id Template's id
 *
 * @returns The deleted template
 */
export async function deleteTemplate(id: string): Promise<TemplateType> {
  const template = await prisma.template.delete({ where: { id } });

  logger.debug({
    id: template.id,
    action: 'Deleted',
    msg: 'Deleted',
  });

  return ensureSchema(Template, template);
}

/**
 * Get count of templates
 *
 * @param filters Template filters
 *
 * @returns Count of templates
 */
export function countTemplates(filters?: TemplateQueryFiltersType): Promise<number> {
  const prismaQuery: Prisma.TemplateCountArgs = {};

  // Apply filters
  if (filters) {
    prismaQuery.where = applyFilters(filters);
  }

  return prisma.template.count(prismaQuery);
}

/**
 * Get if template exists
 *
 * @param id The template's id
 *
 * @returns True if template exists
 */
export async function doesTemplateExist(id: string): Promise<boolean> {
  return (await prisma.template.count({ where: { id } })) > 0;
}

/**
 * Get default template
 *
 * @returns The default template
 */
export async function getDefaultTemplate(): Promise<TemplateType | null> {
  const template = await prisma.template.findUnique({
    where: { name: defaultTemplate.name },
  });

  return template && ensureSchema(Template, template);
}

/**
 * Upsert default template
 *
 * @returns The default template
 */
export async function upsertDefaultTemplate(): Promise<TemplateType> {
  const data: InputTemplateType = {
    name: defaultTemplate.name,
    body: {
      version: 2,
      dateField: defaultTemplate.dateField,
      layouts: [],
    },
  };

  const template = await prisma.template.upsert({
    where: { name: defaultTemplate.name },
    update: data,
    create: data,
  });

  return template && ensureSchema(Template, template);
}
