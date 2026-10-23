import { z } from '@ezreeport/models/lib/zod';

/**
 * Validation for a RPC request
 */
export const RPCRequest = z.object({
  method: z.string().min(1).describe('RPC method name'),

  params: z.array(z.any()).describe('RPC method parameters'),

  toAll: z
    .boolean()
    .default(false)
    .optional()
    .describe('Is RPC request sent to all services'),
});

/**
 * Type for a RPC request
 */
export type RPCRequestType = z.infer<typeof RPCRequest>;

/**
 * Validation for a RPC response
 */
export const RPCResponse = z.object({
  error: z.string().min(1).optional().describe('RPC method error'),

  result: z.unknown().optional().describe('RPC method result'),
});

/**
 * Type for a RPC response
 */
export type RPCResponseType = z.infer<typeof RPCResponse>;
