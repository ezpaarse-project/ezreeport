import { hostname } from 'node:os';

import type {
  HeartbeatListener,
  HeartbeatSender,
  HeartbeatService,
} from '@ezreeport/heartbeats/types';
import { isBefore } from '@ezreeport/dates';
import {
  listenToHeartbeats,
  mandatoryService,
  setupHeartbeat,
} from '@ezreeport/heartbeats';

import type rabbitmq from '~/lib/rabbitmq';
import config from '~/lib/config';
import { elasticPing } from '~/lib/elastic';
import { appLogger } from '~/lib/logger';
import { dbPing } from '~/lib/prisma';

import type { HeartbeatType } from './types';
// oxlint-disable-next-line import/extensions
import { version } from '../../../package.json' with { type: 'json' };

const { heartbeat: frequency } = config;
const logger = appLogger.child({ scope: 'heartbeat' });

export const service: HeartbeatService = {
  connectedServices: {
    database: mandatoryService('database', dbPing),
    elastic: elasticPing,
  },
  filesystems: {
    logs: config.log.dir,
  },
  name: 'api',
  version,
};

let heartbeat: HeartbeatSender | undefined;
// oxlint-disable-next-line no-underscore-dangle
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
        hostname: server.cluster_name || 'rabbitmq',
        nextAt: new Date(now.getTime() + frequency.self),
        service: 'rabbitmq',
        updatedAt: now,
        version: server.version,
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
    [...services.values()]
      // Filter out services that haven't given heartbeats in time
      .filter((srv) => {
        const maxTimestamp = srv.nextAt.getTime() + frequency.connected.max;

        return isBefore(now, maxTimestamp);
      })
  );
}
