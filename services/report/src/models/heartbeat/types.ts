import { Heartbeat as CommonHeartbeat } from '@ezreeport/heartbeats/types';
import { z } from '@ezreeport/models/lib/zod';

export const Heartbeat = z.object({
  ...CommonHeartbeat.shape,

  createdAt: z.date(),
});

export type HeartbeatType = z.infer<typeof Heartbeat>;
