import { Generation, type GenerationType } from '@ezreeport/models/generations';

import { appLogger } from '~/lib/logger';
import prisma from '~/lib/prisma';

const logger = appLogger.child({ model: 'generations', scope: 'models' });

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
  data: GenerationType
): Promise<GenerationType> {
  const generation = await prisma.generation.upsert({
    create: data,
    update: data,
    where: {
      id,
    },
  });

  logger.debug({
    action: 'Updated',
    id: generation.id,
    msg: 'Updated',
  });

  return Generation.parseAsync(generation);
}

/**
 * Mark as `ABORTED` all prior generations
 *
 * @returns count of aborted
 */
export async function abortDanglingGenerations(): Promise<number> {
  const { count } = await prisma.generation.updateMany({
    data: {
      status: 'ABORTED',
    },
    where: {
      status: { in: ['PENDING', 'PROCESSING'] },
    },
  });

  logger.debug({
    action: 'Updated',
    count,
    msg: 'Dangling(s) aborted',
  });

  return count;
}
