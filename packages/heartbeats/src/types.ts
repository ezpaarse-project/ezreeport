import { z } from '@ezreeport/models/lib/zod';

export const Heartbeat = z.object({
  service: z.string().min(1)
    .describe('Service sending the heartbeat'),

  hostname: z.string().min(1)
    .describe('Hostname of the service'),

  version: z.string().min(1).optional()
    .describe('Version of the service'),

  updatedAt: z.coerce.date()
    .describe('Creation date of heartbeat'),
});

export type HeartbeatType = z.infer<typeof Heartbeat>;

export type HeartbeatService = {
  name: string,
  version: string,
  getConnectedServices?: () => Promise<HeartbeatType>[],
};
