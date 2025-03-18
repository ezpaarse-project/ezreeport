import { hostname } from 'node:os';
import { statfs } from 'node:fs/promises';

import {
  setupHeartbeat,
  listenToHeartbeats,
  mandatoryService,
  type HeartbeatService,
} from '~common/lib/heartbeats';
import { isAfter } from '~common/lib/date-fns';
import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';
import config from '~/lib/config';

import { version } from '../../../package.json';
import type { HeartbeatType, FileSystemsType, FileSystemUsageType } from './types';
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

export async function initHeartbeat(connection: rabbitmq.ChannelModel) {
  const start = process.uptime();
  const server = connection.connection.serverProperties;

  const channel = await connection.createChannel();
  logger.debug('Channel created');

  const { send } = await setupHeartbeat(channel, service, logger, false, frequency);

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

export { getMissingMandatoryServices } from '~common/lib/heartbeats';

export function getAllServices() {
  return Array.from(services.values())
    // Filter out services that haven't given heartbeats in 2x the frequency
    .filter((s) => isAfter(s.updatedAt, new Date(Date.now() - (frequency * 2))));
}

/**
 * Map of paths that need to be watched
 */
const filesystemsPaths: Record<FileSystemsType, string> = {
  reports: config.reportDir,
  logs: config.log.dir,
};

export const filesystems = new Set(Object.keys(filesystemsPaths) as FileSystemsType[]);

/**
 * Get usage of a filesystem
 *
 * @param fs The filesystem
 *
 * @returns The usage
 */
export async function getFileSystemUsage(fs: FileSystemsType): Promise<FileSystemUsageType> {
  const path = filesystemsPaths[fs];
  const stats = await statfs(path);

  const total = stats.bsize * stats.blocks;
  const available = stats.bavail * stats.bsize;

  return {
    name: fs,
    total,
    available,
    used: total - available,
  };
}

/**
 * Get usage of all filesystems
 *
 * @returns All usages
 */
export function getAllFileSystemUsage(): Promise<FileSystemUsageType[]> {
  return Promise.all(Array.from(filesystems).map((fs) => getFileSystemUsage(fs)));
}
