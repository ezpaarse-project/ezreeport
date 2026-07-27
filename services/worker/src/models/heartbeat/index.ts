import type {
  HeartbeatSender,
  HeartbeatService,
} from '@ezreeport/heartbeats/types';
import { mandatoryService, setupHeartbeat } from '@ezreeport/heartbeats';

import type rabbitmq from '~/lib/rabbitmq';
import config from '~/lib/config';
// Import getChannel from './channel';
import { elasticPing } from '~/lib/elastic';
import { appLogger } from '~/lib/logger';

// oxlint-disable-next-line import/extensions
import { version } from '../../../package.json' with { type: 'json' };

const { heartbeat: frequency } = config;

const logger = appLogger.child({ scope: 'heartbeat' });

const service: HeartbeatService = {
  connectedServices: {
    elastic: mandatoryService('elastic', elasticPing),
  },
  filesystems: {
    logs: config.log.dir,
  },
  name: 'worker',
  version,
};

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
