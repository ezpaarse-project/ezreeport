import prisma, { type Prisma } from '~/lib/prisma';
import { appLogger } from '~/lib/logger';
import { ensureSchema } from '~common/lib/zod';

import type { PaginationType } from '~/models/pagination/types';
import { buildPaginatedRequest } from '~/models/pagination';

import { Generation, type GenerationType } from '~common/types/generations';

const logger = appLogger.child({ scope: 'models', model: 'generations' });

/**
 * Get all generations
 *
 * @param pagination Pagination options
 *
 * @returns All generations following pagination
 */
export async function getAllGenerations(
  pagination?: PaginationType,
): Promise<GenerationType[]> {
  // Prepare Prisma query
  const prismaQuery: Prisma.GenerationFindManyArgs = buildPaginatedRequest(pagination);

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
 *
 * @returns The found generation, or `null` if not found
 */
export async function getGeneration(id: string): Promise<GenerationType | null> {
  const generation = await prisma.generation.findUnique({ where: { id } });

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
export async function upsertGeneration(id: string, data: GenerationType): Promise<GenerationType> {
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
