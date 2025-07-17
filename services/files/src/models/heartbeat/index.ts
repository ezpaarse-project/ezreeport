import { setupHeartbeat } from '@ezreeport/heartbeats';
import type {
  HeartbeatService,
  HeartbeatSender,
} from '@ezreeport/heartbeats/types';

import type rabbitmq from '~/lib/rabbitmq';
import config from '~/lib/config';
import { appLogger } from '~/lib/logger';

import { version } from '../../../package.json';

const { heartbeat: frequency } = config;

export const service: HeartbeatService = {
  name: 'files',
  version,
  filesystems: {
    logs: config.log.dir,
    reports: config.paths.reports,
  },
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
