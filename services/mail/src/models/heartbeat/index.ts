import type {
  HeartbeatSender,
  HeartbeatService,
} from '@ezreeport/heartbeats/types';
import { mandatoryService, setupHeartbeat } from '@ezreeport/heartbeats';

import type rabbitmq from '~/lib/rabbitmq';
import config from '~/lib/config';
import { appLogger } from '~/lib/logger';
import { SMTPPing } from '~/lib/mailer';

// oxlint-disable-next-line import/extensions
import { version } from '../../../package.json' with { type: 'json' };

const { heartbeat: frequency } = config;

const logger = appLogger.child({ scope: 'heartbeat' });

let heartbeat: HeartbeatSender | null = null;

const service: HeartbeatService = {
  connectedServices: {
    smtp: mandatoryService('smtp', SMTPPing),
  },
  filesystems: {
    logs: config.log.dir,
  },
  name: 'mail',
  version,
};

export { getMissingMandatoryServices } from '@ezreeport/heartbeats';

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
