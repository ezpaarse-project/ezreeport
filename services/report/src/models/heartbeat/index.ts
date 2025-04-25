import { hostname } from 'node:os';

import { isAfter } from '@ezreeport/dates';
import { setupHeartbeat, listenToHeartbeats, mandatoryService } from '@ezreeport/heartbeats';
import type { HeartbeatService } from '@ezreeport/heartbeats/types';

import { appLogger } from '~/lib/logger';
import config from '~/lib/config';
import type rabbitmq from '~/lib/rabbitmq';
import { elasticPing } from '~/lib/elastic';
import { dbPing } from '~/lib/prisma';

import { version } from '../../../package.json';
import type { HeartbeatType } from './types';

const { heartbeat: frequency } = config;
const logger = appLogger.child({ scope: 'heartbeat' });

export const service: HeartbeatService = {
  name: 'api',
  version,
  filesystems: {
    logs: config.log.dir,
  },
  getConnectedServices: () => [
    mandatoryService('database', dbPing),
    elasticPing(),
  ],
};

const services = new Map<string, HeartbeatType>();

export async function initHeartbeat(connection: rabbitmq.ChannelModel) {
  const start = process.uptime();
  const server = connection.connection.serverProperties;

  const channel = await connection.createChannel();
  logger.debug('Channel created');

  const { send } = await setupHeartbeat(channel, service, logger, false, frequency);

  await listenToHeartbeats(channel, logger, function onHeartbeat(beat) {
    // If it's the same machine, then we can consider RabbitMQ as working
    if (beat.hostname === hostname()) {
      onHeartbeat({
        service: 'rabbitmq',
        hostname: server.cluster_name || 'rabbitmq',
        version: server.version,
        updatedAt: new Date(),
      });
    }

    const { createdAt } = services.get(beat.hostname) ?? { createdAt: new Date() };
    services.set(`${beat.hostname}_${beat.service}`, { ...beat, createdAt });
  });

  send();

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}

export { getMissingMandatoryServices } from '@ezreeport/heartbeats';

export function getAllServices() {
  return Array.from(services.values())
    // Filter out services that haven't given heartbeats in 2x the frequency
    .filter((s) => isAfter(s.updatedAt, new Date(Date.now() - (frequency * 2))));
}
