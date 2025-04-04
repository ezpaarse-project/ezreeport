import { z } from '@ezreeport/models/lib/zod';
import { Heartbeat as CommonHeartbeat } from '@ezreeport/heartbeats/types';

export const Heartbeat = CommonHeartbeat.extend({
  createdAt: z.date(),
});

export type HeartbeatType = z.infer<typeof Heartbeat>;

/**
 * Validation for file system usage
 */
export const FileSystemUsage = z.object({
  name: z.string().min(1)
    .describe('Filesystem name'),

  total: z.number()
    .describe('Total space'),

  used: z.number()
    .describe('Used space'),

  available: z.number()
    .describe('Available space'),
});

/**
 * Type for file system usage
 */
export type FileSystemUsageType = z.infer<typeof FileSystemUsage>;

/**
 * Validation for file systems
 */
export const FileSystems = z.enum(['reports', 'logs'] as const);

/**
 * Type for file systems
 */
export type FileSystemsType = z.infer<typeof FileSystems>;
