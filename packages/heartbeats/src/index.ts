import type { rabbitmq } from '@ezreeport/rabbitmq';
import type { Logger } from '@ezreeport/logger';

import type { HeartbeatType, HeartbeatService } from './types';

import { HeartbeatSender } from './HeartBeat/Sender';
import { HeartbeatListener } from './HeartBeat/Listener';

const mandatoryServices = new Map<string, boolean>();

export async function mandatoryService(
  name: string,
  pinger: () => Promise<HeartbeatType>
): Promise<HeartbeatType> {
  try {
    const beat = await pinger();
    mandatoryServices.set(name, true);
    return beat;
  } catch (error) {
    mandatoryServices.set(name, false);
    throw error;
  }
}

export const getMissingMandatoryServices = (): string[] =>
  Array.from(mandatoryServices.entries())
    .filter(([, value]) => !value)
    .map(([key]) => key);

export const setupHeartbeat = (
  channel: rabbitmq.Channel,
  service: HeartbeatService,
  appLogger: Logger,
  isMandatory = false,
  frequency = 10000
): HeartbeatSender =>
  new HeartbeatSender(
    channel,
    appLogger,
    service,
    isMandatory ? mandatoryServices : undefined,
    frequency
  );

export const listenToHeartbeats = (
  channel: rabbitmq.Channel,
  appLogger: Logger,
  onHeartbeat: (beat: HeartbeatType) => Promise<void> | void
): HeartbeatListener => new HeartbeatListener(channel, onHeartbeat, appLogger);

export type { HeartbeatSender, HeartbeatListener };
