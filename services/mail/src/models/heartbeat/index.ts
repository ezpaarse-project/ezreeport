import { setupHeartbeat, mandatoryService } from '@ezreeport/heartbeats';
import type { HeartbeatService } from '@ezreeport/heartbeats/types';

import type rabbitmq from '~/lib/rabbitmq';
import config from '~/lib/config';
import { appLogger } from '~/lib/logger';
import { SMTPPing } from '~/lib/mailer';

import { version } from '../../../package.json';

const { heartbeat: frequency } = config;

const logger = appLogger.child({ scope: 'heartbeat' });

const service: HeartbeatService = {
  name: 'mail',
  version,
  filesystems: {
    logs: config.log.dir,
  },
  getConnectedServices: () => [
    mandatoryService('smtp', SMTPPing),
  ],
};

export { getMissingMandatoryServices } from '@ezreeport/heartbeats';

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
