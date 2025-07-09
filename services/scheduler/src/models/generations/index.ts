import { Generation, type GenerationType } from '@ezreeport/models/generations';

import prisma from '~/lib/prisma';
import { appLogger } from '~/lib/logger';

const logger = appLogger.child({ scope: 'models', model: 'generations' });

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
  data: GenerationType,
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

  return Generation.parseAsync(generation);
}
