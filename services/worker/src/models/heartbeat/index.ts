import { setupHeartbeat, mandatoryService } from '@ezreeport/heartbeats';
import type { HeartbeatService } from '@ezreeport/heartbeats/types';

import config from '~/lib/config';
import { appLogger } from '~/lib/logger';
import type rabbitmq from '~/lib/rabbitmq';

import { version } from '../../../package.json';
// import getChannel from './channel';
import { elasticPing } from '~/lib/elastic';

const { heartbeat: frequency } = config;

const logger = appLogger.child({ scope: 'heartbeat' });

const service: HeartbeatService = {
  name: 'worker',
  version,
  filesystems: {
    logs: config.log.dir,
  },
  getConnectedServices: () => [mandatoryService('elastic', elasticPing)],
};

export { getMissingMandatoryServices } from '@ezreeport/heartbeats';

export async function initHeartbeat(
  connection: rabbitmq.ChannelModel
): Promise<void> {
  const start = process.uptime();

  const channel = await connection.createChannel();
  logger.debug('Channel created');

  const { send } = setupHeartbeat(channel, service, logger, true, frequency);

  send();

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
