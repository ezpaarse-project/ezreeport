// oxlint-disable-next-line unicorn/prefer-export-from
import { rabbitmq, setupRabbitMQ } from '@ezreeport/rabbitmq';

import config from '~/lib/config';
import { appLogger } from '~/lib/logger';

const logger = appLogger.child(
  { scope: 'RabbitMQ' },
  {
    redact: {
      censor: (value) => value && ''.padStart(`${value}`.length, '*'),
      paths: ['config.password'],
    },
  }
);

const { rabbitmq: rmqConfig } = config;

const connectOpts: rabbitmq.Options.Connect = {
  hostname: rmqConfig.host,
  password: rmqConfig.password,
  port: rmqConfig.port,
  protocol: rmqConfig.protocol,
  username: rmqConfig.username,
  vhost: rmqConfig.vhost,
};

/**
 * Setup a connection to RabbitMQ and run a callback
 *
 * Handles automatic re-connection and graceful shutdown
 *
 * @param setup Init function where rabbitmq connection is passed,
 * will be called on each re-connection
 *
 * @returns When first callback resolves
 */
export const useRabbitMQ = (
  setup: (connection: rabbitmq.ChannelModel) => Promise<void>
): Promise<void> => setupRabbitMQ(connectOpts, setup, logger);

// oxlint-disable-next-line import/no-default-export
export default rabbitmq;
