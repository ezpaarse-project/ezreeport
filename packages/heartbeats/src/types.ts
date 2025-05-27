import { z } from '@ezreeport/models/lib/zod';

export const FileSystemUsage = z.object({
  name: z.string().min(1)
    .describe('Filesystem name'),

  total: z.number()
    .describe('Total space in bytes'),

  used: z.number()
    .describe('Used space in bytes'),

  available: z.number()
    .describe('Available space in bytes'),
});

export type FileSystemUsageType = z.infer<typeof FileSystemUsage>;

export const Heartbeat = z.object({
  service: z.string().min(1)
    .describe('Service sending the heartbeat'),

  hostname: z.string().min(1)
    .describe('Hostname of the service'),

  version: z.string().min(1).optional()
    .describe('Version of the service'),

  filesystems: z.array(FileSystemUsage).min(1).optional()
    .describe('Filesystems used by the service'),

  updatedAt: z.coerce.date()
    .describe('Creation date of heartbeat'),
});

export type HeartbeatType = z.infer<typeof Heartbeat>;

export type HeartbeatService = {
  name: string,
  version: string,
  filesystems?: Record<string, string>,
  getConnectedServices?: () => Promise<HeartbeatType>[],
};
