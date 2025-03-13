import { hostname } from 'node:os';

import {
  setupHeartbeat,
  listenToHeartbeats,
  mandatoryService,
  type HeartbeatService,
} from '~common/lib/heartbeats';
import { isAfter } from '~common/lib/date-fns';
import type rabbitmq from '~/lib/rabbitmq';
import config from '~/lib/config';
import { appLogger } from '~/lib/logger';

import { version } from '../../../package.json';
import type { HeartbeatType } from './types';
import { elasticPing } from '~/lib/elastic';
import { dbPing } from '~/lib/prisma';

const { heartbeat: frequency } = config;

const logger = appLogger.child({ scope: 'heartbeat' });

export const service: HeartbeatService = {
  name: 'api',
  version,
  getConnectedServices: () => [
    mandatoryService('database', dbPing),
    elasticPing(),
  ],
};

const services = new Map<string, HeartbeatType>();

export { getMissingMandatoryServices } from '~common/lib/heartbeats';

export function getAllServices() {
  return Array.from(services.values())
    // Filter out services that haven't given heartbeats in 2x the frequency
    .filter((s) => isAfter(s.updatedAt, new Date(Date.now() - (frequency * 2))));
}

export async function initHeartbeat(connection: rabbitmq.ChannelModel) {
  const start = process.uptime();
  const server = connection.connection.serverProperties;

  const channel = await connection.createChannel();
  logger.debug('Channel created');

  const { send } = await setupHeartbeat(channel, service, logger, frequency);

  await listenToHeartbeats(channel, logger, async (b) => {
    let beat = b;
    // If it's the same machine, then we can consider RabbitMQ as working
    if (beat.hostname === hostname()) {
      beat = {
        ...beat,
        service: 'rabbitmq',
        version: server?.version,
      };
    }

    const { createdAt } = services.get(beat.hostname) ?? { createdAt: new Date() };
    services.set(beat.hostname, { ...beat, createdAt });
  });

  send();

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
