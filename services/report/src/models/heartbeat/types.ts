import { z } from '~common/lib/zod';
import { Heartbeat as CommonHeartbeat } from '~common/lib/heartbeats';

export const Heartbeat = CommonHeartbeat.extend({
  createdAt: z.date(),
});

export type HeartbeatType = z.infer<typeof Heartbeat>;
