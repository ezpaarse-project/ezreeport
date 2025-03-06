/* eslint-disable import/prefer-default-export */
import { z } from '~/lib/zod';

import { Recurrence as PrismaRecurrence } from '~/lib/prisma';

/**
 * Validation for a recurrence
 */
export const Recurrence = z.nativeEnum(PrismaRecurrence);
