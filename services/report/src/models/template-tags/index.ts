import { ensureSchema } from '@ezreeport/models/lib/zod';
import type { Prisma } from '@ezreeport/database/types';
import prisma from '~/lib/prisma';
import { appLogger } from '~/lib/logger';

import type { PaginationType } from '~/models/pagination/types';
import { buildPaginatedRequest } from '~/models/pagination';

import { TemplateTag, type TemplateTagType } from '~/models/templates/types';

import type {
  InputTemplateTagType,
  TemplateTagQueryFiltersType,
} from './types';

const logger = appLogger.child({ scope: 'models', model: 'template-tags' });

function applyFilters(
  filters: TemplateTagQueryFiltersType
): Prisma.TemplateTagWhereInput {
  const where: Prisma.TemplateTagWhereInput = {};

  if (filters.query) {
    where.name = {
      contains: filters.query,
      mode: 'insensitive' as Prisma.QueryMode,
    };
  }

  return where;
}

/**
 * Get all tags
 *
 * @param pagination Pagination options
 *
 * @returns All tags following pagination
 */
export async function getAllTemplateTags(
  filters?: TemplateTagQueryFiltersType,
  pagination?: PaginationType
): Promise<TemplateTagType[]> {
  // Prepare Prisma query
  const prismaQuery: Prisma.TemplateTagFindManyArgs =
    buildPaginatedRequest(pagination);

  // Apply filters
  if (filters) {
    prismaQuery.where = applyFilters(filters);
  }

  // Fetch data
  const data = await prisma.templateTag.findMany(prismaQuery);

  // Ensure data
  const tags = await Promise.all(
    data.map((tag) =>
      ensureSchema(
        TemplateTag,
        tag,
        (tag) => `Failed to parse template ${tag.id}`
      )
    )
  );
  return tags;
}

/**
 * Get one tag
 *
 * @param id The tag's id
 *
 * @returns The found tag, or `null` if not found
 */
export async function getTemplateTag(
  id: string
): Promise<TemplateTagType | null> {
  const prismaQuery: Prisma.TemplateFindUniqueArgs = { where: { id } };

  const tag = await prisma.template.findUnique(prismaQuery);

  return tag && ensureSchema(TemplateTag, tag);
}

/**
 * Create a new tag, throws if constraint is broken
 *
 * @param data The tag's data
 *
 * @returns The created tag
 */
export async function createTemplateTag(
  data: InputTemplateTagType & { id?: string }
): Promise<TemplateTagType> {
  const tag = await prisma.templateTag.create({ data });

  logger.debug({
    id: tag.id,
    action: 'Created',
    msg: 'Created',
  });

  return ensureSchema(TemplateTag, tag);
}

/**
 * Edit a tag, throws if tag doesn't exists or if constraint is broken
 *
 * @param id Template's id
 * @param data The tag's data
 *
 * @returns The edited tag
 */
export async function editTemplateTag(
  id: string,
  data: InputTemplateTagType
): Promise<TemplateTagType> {
  const tag = await prisma.templateTag.update({ where: { id }, data });

  logger.debug({
    id: tag.id,
    action: 'Updated',
    msg: 'Updated',
  });

  return ensureSchema(TemplateTag, tag);
}

/**
 * Delete a tag, throws if tag doesn't exists
 *
 * @param id tag's id
 *
 * @returns The deleted tag
 */
export async function deleteTemplateTag(id: string): Promise<TemplateTagType> {
  const tag = await prisma.templateTag.delete({ where: { id } });

  logger.debug({
    id: tag.id,
    action: 'Deleted',
    msg: 'Deleted',
  });

  return ensureSchema(TemplateTag, tag);
}

/**
 * Get count of tags
 *
 * @param filters tag filters
 *
 * @returns Count of tags
 */
export async function countTemplateTags(
  filters?: TemplateTagQueryFiltersType
): Promise<number> {
  const prismaQuery: Prisma.TemplateTagCountArgs = {};

  // Apply filters
  if (filters) {
    prismaQuery.where = applyFilters(filters);
  }

  const result = await prisma.templateTag.count({
    ...prismaQuery,
    select: { id: true },
  });

  return result.id;
}

/**
 * Get if tag exists
 *
 * @param id The tag's id
 *
 * @returns True if tag exists
 */
export async function doesTemplateTagExist(id: string): Promise<boolean> {
  const count = await prisma.templateTag.count({
    where: { id },
    select: { id: true },
  });

  return count.id > 0;
}
