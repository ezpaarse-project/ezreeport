import { setupRabbitMQ, rabbitmq } from '@ezreeport/rabbitmq';

import { appLogger } from '~/lib/logger';
import config from '~/lib/config';

const logger = appLogger.child(
  { scope: 'RabbitMQ' },
  {
    redact: {
      paths: ['config.password'],
      censor: (value) => value && ''.padStart(`${value}`.length, '*'),
    },
  },
);

const { rabbitmq: rmqConfig } = config;

const connectOpts: rabbitmq.Options.Connect = {
  hostname: rmqConfig.host,
  port: rmqConfig.port,
  vhost: rmqConfig.vhost,
  protocol: rmqConfig.protocol,
  username: rmqConfig.username,
  password: rmqConfig.password,
};

/**
 * Setup a connection to RabbitMQ and run a callback
 *
 * Handles automatic reconnection and graceful shutdown
 *
 * @param callback Init function where rabbitmq connection is passed,
 * will be called on each reconnection
 *
 * @returns When first callback resolves
 */
export const useRabbitMQ = (
  callback: (connection: rabbitmq.ChannelModel) => Promise<void>,
) => setupRabbitMQ(connectOpts, callback, logger);

export default rabbitmq;
