import { z } from '@ezreeport/models/lib/zod';

/**
 * Validation for index
 */
export const Index = z.string();

/**
 * Type for index
 */
export type IndexType = z.infer<typeof Index>;

/**
 * Validation for index mapping
 */
export const Mapping = z.record(z.string(), z.string());

/**
 * Type for index mapping
 */
export type MappingType = z.infer<typeof Mapping>;
