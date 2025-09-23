import { hostname } from 'node:os';

import { isAfter } from '@ezreeport/dates';
import {
  setupHeartbeat,
  listenToHeartbeats,
  mandatoryService,
} from '@ezreeport/heartbeats';
import type {
  HeartbeatSender,
  HeartbeatListener,
  HeartbeatService,
} from '@ezreeport/heartbeats/types';

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
  connectedServices: {
    database: mandatoryService('database', dbPing),
    elastic: elasticPing,
  },
};

let heartbeat: HeartbeatSender | undefined;
let _listener: HeartbeatListener | undefined;
const services = new Map<string, HeartbeatType>();

export async function initHeartbeat(
  connection: rabbitmq.ChannelModel
): Promise<void> {
  const start = process.uptime();
  const server = connection.connection.serverProperties;

  const channel = await connection.createChannel();
  logger.debug('Channel created');

  heartbeat = setupHeartbeat(channel, service, logger, false, frequency);

  const nodeId = `${hostname()}:${process.pid}`;

  _listener = listenToHeartbeats(channel, logger, function onHeartbeat(beat) {
    // If it's the same machine, then we can consider RabbitMQ as working
    if (beat.hostname === nodeId) {
      const now = new Date();

      onHeartbeat({
        service: 'rabbitmq',
        hostname: server.cluster_name || 'rabbitmq',
        version: server.version,
        updatedAt: now,
        nextAt: new Date(now.getTime() + frequency.self),
      });
    }

    const { createdAt } = services.get(beat.hostname) ?? {
      createdAt: new Date(),
    };
    services.set(`${beat.hostname}_${beat.service}`, { ...beat, createdAt });
  });

  heartbeat.send();

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}

export { getMissingMandatoryServices } from '@ezreeport/heartbeats';

export function getAllServices(): HeartbeatType[] {
  const now = new Date();

  return (
    Array.from(services.values())
      // Filter out services that haven't given heartbeats in time
      .filter((service) =>
        isAfter(service.nextAt.getTime() + frequency.connected.max, now)
      )
  );
}
