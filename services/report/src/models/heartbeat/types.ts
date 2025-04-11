import { z } from '@ezreeport/models/lib/zod';
import { Heartbeat as CommonHeartbeat } from '@ezreeport/heartbeats/types';

export const Heartbeat = CommonHeartbeat.extend({
  createdAt: z.date(),
});

export type HeartbeatType = z.infer<typeof Heartbeat>;
