import type rabbitmq from '~/lib/rabbitmq';

import { setupHeartbeat, mandatoryService, type HeartbeatService } from '~common/lib/heartbeats';
import config from '~/lib/config';
import { appLogger } from '~/lib/logger';

import { version } from '../../../package.json';
// import getChannel from './channel';
import { elasticPing } from '~/lib/elastic';

const { heartbeat: frequency } = config;

const logger = appLogger.child({ scope: 'heartbeat' });

const service: HeartbeatService = {
  name: 'worker',
  version,
  getConnectedServices: () => [
    mandatoryService('elastic', elasticPing),
  ],
};

export { getMissingMandatoryServices } from '~common/lib/heartbeats';

export async function initHeartbeat(connection: rabbitmq.ChannelModel) {
  const start = process.uptime();

  const channel = await connection.createChannel();
  logger.debug('Channel created');

  const { send } = await setupHeartbeat(channel, service, logger, true, frequency);

  send();

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
