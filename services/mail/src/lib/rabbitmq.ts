import { setTimeout } from 'node:timers/promises';

import amqp from 'amqplib';

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
export async function useRabbitMQ(callback: (connection: amqp.ChannelModel) => Promise<void>) {
  // Used to prevent reconnection while stopping
  let stopping = false;

  /**
   * Attempts to connect to RabbitMQ, reconnecting on failure
   *
   * @returns RabbitMQ connection
   */
  const connect = async () => {
    try {
      const connection = await amqp.connect({
        hostname: config.rabbitmq.host,
        port: config.rabbitmq.port,
        vhost: config.rabbitmq.vhost,
        protocol: config.rabbitmq.protocol,
        username: config.rabbitmq.username,
        password: config.rabbitmq.password,
      });

      logger.info({
        msg: 'Connected to RabbitMQ',
        config: config.rabbitmq,
      });

      return connection;
    } catch (err) {
      logger.error({ msg: 'Failed to connect to RabbitMQ', err });
      await setTimeout(5000);
      return connect();
    }
  };

  /**
   * Setup graceful shutdown and automatic reconnection
   */
  const init = async () => {
    const connection = await connect();
    stopping = false;

    /**
     * Gracefully close connection
     */
    const gracefullyStop = () => {
      stopping = true;
      connection.close()
        .then(() => logger.debug('Connection closed'))
        .catch((err) => logger.error({ msg: 'Failed to close connection', err }));
    };

    process.on('SIGTERM', gracefullyStop);

    connection.on('close', () => {
      if (stopping) {
        return;
      }

      // Prevent stopping multiple times
      process.off('SIGTERM', gracefullyStop);

      // Reconnect and re-run callback
      logger.debug('Reconnecting to RabbitMQ');
      init();
    });

    await callback(connection);
  };

  return init();
}

export default amqp;
