import { setTimeout } from 'node:timers/promises';

import type z from 'zod/v4';
import amqp from 'amqplib';

import type { Logger } from '@ezreeport/logger';

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
  opts?: Omit<amqp.Options.Publish, 'contentType'>,
): { sent: boolean, size: number } {
  const options: amqp.Options.Publish = {
    ...opts,
    contentType: 'application/json',
  };

  const buf = Buffer.from(JSON.stringify(content));

  const sent = channel.sendToQueue(queue, buf, options);
  return { sent, size: buf.byteLength };
}

export function publishJSONToExchange<T>(
  channel: amqp.Channel,
  exchange: string,
  routingKey: string,
  content: T,
  opts?: Omit<amqp.Options.Publish, 'contentType'>,
): { sent: boolean, size: number } {
  const options: amqp.Options.Publish = {
    ...opts,
    contentType: 'application/json',
  };

  const buf = Buffer.from(JSON.stringify(content));

  const sent = channel.publish(exchange, routingKey, buf, options);
  return { sent, size: buf.byteLength };
}

/**
 * Shorthand to parse JSON data from a message
 *
 * @param msg The message
 * @param schema The schema
 *
 * @returns The parsed data
 */
export function parseJSONMessage<T>(
  msg: amqp.ConsumeMessage,
  schema: z.ZodSchema<T>,
): { data?: T, raw: unknown, parseError?: unknown } {
  const raw = JSON.parse(msg.content.toString());
  let data: T;
  try {
    data = schema.parse(raw);
  } catch (parseError) {
    return { raw, parseError };
  }
  return { data, raw };
}

export * as rabbitmq from 'amqplib';
