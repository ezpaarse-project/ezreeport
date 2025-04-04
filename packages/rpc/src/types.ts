import { z } from '@ezreeport/models/lib/zod';

/**
 * Validation for a RPC request
 */
export const RPCRequest = z.object({
  method: z.string().min(1)
    .describe('RPC method name'),

  params: z.array(z.any())
    .describe('RPC method parameters'),
});

/**
 * Type for a RPC request
 */
export type RPCRequestType = z.infer<typeof RPCRequest>;

/**
 * Validation for a RPC response
 */
export const RPCResponse = z.object({
  result: z.unknown().optional()
    .describe('RPC method result'),

  error: z.string().min(1).optional()
    .describe('RPC method error'),
});

/**
 * Type for a RPC response
 */
export type RPCResponseType = z.infer<typeof RPCResponse>;
