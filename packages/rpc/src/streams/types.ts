import { z } from '@ezreeport/models/lib/zod';

/**
 * Validation for a stream chuck
 */
export const RPCStreamChunk = z.object({
  chunk: z.object({
    type: z.literal('Buffer'),
    data: z.array(z.number()),
  }).optional()
    .describe('Stream chunk'),

  ended: z.boolean()
    .describe('End of stream'),

  error: z.string().min(1).optional()
    .describe('RPC method error'),
});

/**
 * Type for a stream chunk
 */
export type RPCStreamChunkType = z.infer<typeof RPCStreamChunk>;

/**
 * Validation for a RPC request for a write stream
 */
export const RPCWriteStreamRequest = z.object({
  method: z.literal('createWriteStream'),

  params: z.array(z.any())
    .describe('Stream request parameters'),

  dataQueue: z.string().min(1)
    .describe('Data queue name'),
});

/**
 * Type for a RPC request for a write stream
 */
export type RPCWriteStreamRequestType = z.infer<typeof RPCWriteStreamRequest>;

/**
 * Validation for a RPC request for a read stream
 */
export const RPCReadStreamRequest = z.object({
  method: z.literal('createReadStream'),

  params: z.array(z.any())
    .describe('Stream request parameters'),
});

/**
 * Type for a RPC request for a read stream
 */
export type RPCReadStreamRequestType = z.infer<typeof RPCReadStreamRequest>;

/**
 * Validation for a RPC response
 */
export const RPCStreamResponse = z.object({
  result: z.boolean()
    .describe('Is the stream successful'),

  error: z.string().min(1).optional()
    .describe('RPC method error'),
});

/**
 * Type for a RPC response
 */
export type RPCStreamResponseType = z.infer<typeof RPCStreamResponse>;

export const RPCStreamRequest = z.discriminatedUnion('method', [
  RPCWriteStreamRequest,
  RPCReadStreamRequest,
]);

export type RPCStreamRequestType = z.infer<typeof RPCStreamRequest>;
