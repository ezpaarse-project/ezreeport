import { z } from '@ezreeport/models/lib/zod';
import { Heartbeat as CommonHeartbeat } from '@ezreeport/heartbeats/types';

export const Heartbeat = z.object({
  ...CommonHeartbeat.shape,

  createdAt: z.date(),
});

export type HeartbeatType = z.infer<typeof Heartbeat>;
