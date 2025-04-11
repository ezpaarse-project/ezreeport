import { setTimeout } from 'node:timers/promises';

import type { Logger } from '@ezreeport/logger';

import amqp from 'amqplib';

export async function setupRabbitMQ(
  connectOpts: amqp.Options.Connect,
  callback: (connection: amqp.ChannelModel) => Promise<void>,
  logger: Logger,
) {
  // Used to prevent reconnection while stopping
  let stopping = false;

  /**
   * Attempts to connect to RabbitMQ, reconnecting on failure
   *
   * @returns RabbitMQ connection
   */
  const connect = async () => {
    try {
      const connection = await amqp.connect(connectOpts);

      logger.info({
        msg: 'Connected to RabbitMQ',
        config: connectOpts,
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

/**
 * Shorthand to send data as JSON to a queue
 *
 * @param channel The channel to use
 * @param queue The queue name
 * @param content The data
 * @param options The options
 *
 * @returns Information about data
 */
export function sendJSONToQueue<T>(
  channel: amqp.Channel,
  queue: string,
  content: T,
  options?: amqp.Options.Publish,
): { sent: boolean, size: number } {
  const buf = Buffer.from(JSON.stringify(content));
  const sent = channel.sendToQueue(queue, buf, options);
  return { sent, size: buf.byteLength };
}

export * as rabbitmq from 'amqplib';
