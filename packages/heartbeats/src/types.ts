import { z } from '@ezreeport/models/lib/zod';

export const FileSystemUsage = z.object({
  name: z.string().min(1).describe('Filesystem name'),

  total: z.int().min(-1).describe('Total space in bytes'),

  used: z.int().min(-1).describe('Used space in bytes'),

  available: z.int().min(-1).describe('Available space in bytes'),
});

export type FileSystemUsageType = z.infer<typeof FileSystemUsage>;

export const Heartbeat = z.object({
  service: z.string().min(1).describe('Service sending the heartbeat'),

  hostname: z.string().min(1).describe('Hostname of the service'),

  version: z.string().min(1).optional().describe('Version of the service'),

  filesystems: z
    .array(FileSystemUsage)
    .min(1)
    .optional()
    .describe('Filesystems used by the service'),

  updatedAt: z.coerce.date().describe('Creation date of heartbeat'),

  nextAt: z.coerce.date().describe('When the next heartbeat should happen'),
});

export type HeartbeatType = z.infer<typeof Heartbeat>;

export type HeartbeatConnectedServicePing = () => Promise<
  Omit<HeartbeatType, 'nextAt' | 'updatedAt'>
>;

export type HeartbeatService = {
  name: string;
  version: string;
  filesystems?: Record<string, string>;
  connectedServices?: Record<string, HeartbeatConnectedServicePing>;
};

export type { HeartbeatSender } from './HeartBeat/Sender';
export type { HeartbeatListener } from './HeartBeat/Listener';

export type HeartbeatFrequency = {
  self: number;
  connected: {
    min: number;
    max: number;
  };
};
