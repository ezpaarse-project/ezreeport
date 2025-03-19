import prisma, { type Prisma } from '~/lib/prisma';
import { appLogger } from '~/lib/logger';
import { ensureSchema } from '~common/lib/zod';

import type { PaginationType } from '~/models/pagination/types';
import { buildPaginatedRequest } from '~/models/pagination';

import type { GenerationType as CommonGenerationType } from '~common/types/generations';
import { Generation, GenerationIncludeFieldsType, type GenerationType } from './types';

const logger = appLogger.child({ scope: 'models', model: 'generations' });

function applyIncludes(fields: GenerationIncludeFieldsType[]): Prisma.GenerationInclude {
  let onlyTask = false;
  let task: Prisma.TaskInclude | undefined;

  if (fields.includes('task.namespace')) {
    task = task || {};
    task.namespace = true;
  }

  if (fields.includes('task.extends.tags')) {
    task = task || {};
    task.extends = { select: { tags: true } };
  }

  if (fields.includes('task')) {
    onlyTask = true;
  }

  return {
    task: task ? { include: task } : onlyTask,
  };
}

/**
 * Get all generations
 *
 * @param include Fields to include
 * @param pagination Pagination options
 *
 * @returns All generations following pagination
 */
export async function getAllGenerations(
  include?: GenerationIncludeFieldsType[],
  pagination?: PaginationType,
): Promise<GenerationType[]> {
  // Prepare Prisma query
  const prismaQuery: Prisma.GenerationFindManyArgs = buildPaginatedRequest(pagination);

  // Apply includes
  if (include) {
    prismaQuery.include = applyIncludes(include);
  }

  // Fetch data
  const data = await prisma.generation.findMany(prismaQuery);

  // Ensure data
  const generations = await Promise.all(
    data.map((generation) => ensureSchema(Generation, generation, (n) => `Failed to parse generation ${n.id}`)),
  );
  return generations;
}

/**
 * Get one generation
 *
 * @param id The generation's id
 * @param include Fields to include
 *
 * @returns The found generation, or `null` if not found
 */
export async function getGeneration(
  id: string,
  include?: GenerationIncludeFieldsType[],
): Promise<GenerationType | null> {
  const prismaQuery: Prisma.GenerationFindUniqueArgs = { where: { id } };

  // Apply includes
  if (include) {
    prismaQuery.include = applyIncludes(include);
  }

  const generation = await prisma.generation.findUnique(prismaQuery);

  return generation && ensureSchema(Generation, generation);
}

/**
 * Upserts a new generation, throws if constraint is broken
 *
 * @param id The generation's id
 * @param data The generation's data
 *
 * @returns The created/updated generation
 */
export async function upsertGeneration(
  id: string,
  data: CommonGenerationType,
): Promise<GenerationType> {
  const generation = await prisma.generation.upsert({
    where: {
      id,
    },
    create: data,
    update: data,
  });

  logger.debug({
    id: generation.id,
    action: 'Updated',
    msg: 'Updated',
  });

  return ensureSchema(Generation, generation);
}

/**
 * Get count of generation
 *
 * @param filters Filters options
 *
 * @returns Count of generation
 */
export async function countGenerations(): Promise<number> {
  const prismaQuery: Prisma.GenerationCountArgs = {};

  const result = await prisma.generation.count({
    ...prismaQuery,
    select: { id: true },
  });

  return result.id;
}

/**
 * Get if generation exists
 *
 * @param id The generation's id
 *
 * @returns True if generation exists
 */
export async function doesGenerationExist(id: string): Promise<boolean> {
  const count = await prisma.generation.count({ where: { id }, select: { id: true } });

  return count.id > 0;
}
