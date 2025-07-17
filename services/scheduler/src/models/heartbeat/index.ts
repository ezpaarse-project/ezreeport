import {
  setupHeartbeat,
  mandatoryService,
  type HeartbeatSender,
} from '@ezreeport/heartbeats';
import type { HeartbeatService } from '@ezreeport/heartbeats/types';

import type rabbitmq from '~/lib/rabbitmq';
import config from '~/lib/config';
import { appLogger } from '~/lib/logger';
import { dbPing } from '~/lib/prisma';

import { version } from '../../../package.json';

const { heartbeat: frequency } = config;

export const service: HeartbeatService = {
  name: 'scheduler',
  version,
  filesystems: {
    logs: config.log.dir,
  },
  getConnectedServices: () => [mandatoryService('database', dbPing)],
};

const logger = appLogger.child({ scope: 'heartbeat' });

export { getMissingMandatoryServices } from '@ezreeport/heartbeats';

let heartbeat: HeartbeatSender | undefined;

export async function initHeartbeat(
  connection: rabbitmq.ChannelModel
): Promise<void> {
  const start = process.uptime();

  const channel = await connection.createChannel();
  logger.debug('Channel created');

  heartbeat = setupHeartbeat(channel, service, logger, true, frequency);

  heartbeat.send();

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
