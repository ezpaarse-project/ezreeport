import { z } from '~common/lib/zod';

/**
 * Validation for success pongs
 */
export const SuccessPong = z.object({
  name: z.string().min(1)
    .describe('Service name'),

  status: z.boolean()
    .describe('Service status'),

  elapsedTime: z.number()
    .describe('Time taken to respond'),

  statusCode: z.number().optional()
    .describe('HTTP status code'),
});

/**
 * Type for success pongs
 */
export type SuccessPongType = z.infer<typeof SuccessPong>;

/**
 * Validation for error pongs
 */
export const ErrorPong = z.object({
  name: z.string().min(1)
    .describe('Service name'),

  status: z.literal(false)
    .describe('Service status'),

  error: z.string().min(1)
    .describe('Error message'),
});

/**
 * Type for error pongs
 */
export type ErrorPongType = z.infer<typeof ErrorPong>;

/**
 * Validation for pongs
 */
export const Pong = z.union([SuccessPong, ErrorPong]);

/**
 * Type for pongs
 */
export type PongType = z.infer<typeof Pong>;

/**
 * Validation for services
 */
export const Services = z.enum(['elastic', 'database'] as const);

/**
 * Type for services
 */
export type ServicesType = z.infer<typeof Services>;
