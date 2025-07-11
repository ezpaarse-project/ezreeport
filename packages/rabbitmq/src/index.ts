import { setTimeout } from 'node:timers/promises';

// oxlint-disable-next-line id-length
import type z from 'zod/v4';
import amqp from 'amqplib';

import type { Logger } from '@ezreeport/logger';

/**
 * Attempts to connect to RabbitMQ, reconnecting on failure
 *
 * @param connectOpts Options to connect to rabbitmq
 * @param logger Logger
 *
 * @returns RabbitMQ connection
 */
async function connectToRabbitMQ(
  connectOpts: amqp.Options.Connect,
  logger: Logger
): Promise<amqp.ChannelModel> {
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
    return connectToRabbitMQ(connectOpts, logger);
  }
}

export function setupRabbitMQ(
  connectOpts: amqp.Options.Connect,
  useRabbitMQ: (connection: amqp.ChannelModel) => Promise<void>,
  logger: Logger
): Promise<void> {
  // Used to prevent re-connection while stopping
  let stopping = false;

  /**
   * Setup graceful shutdown and automatic re-connection
   */
  const init = async (): Promise<void> => {
    const connection = await connectToRabbitMQ(connectOpts, logger);
    stopping = false;

    /**
     * Gracefully close connection
     */
    const gracefullyStop = async (): Promise<void> => {
      stopping = true;
      try {
        await connection.close();
        logger.debug('Connection closed');
      } catch (err) {
        logger.error({ msg: 'Failed to close connection', err });
      }
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

    await useRabbitMQ(connection);
  };

  return init();
}

export type JSONMessageTransportQueue = {
  /** Queue to use to send message */
  queue: {
    name: string;
  };
};

export type JSONMessageTransportExchange = {
  /** Exchange to use to send message */
  exchange: {
    name: string;
    routingKey: string;
  };
};

export type JSONMessageTransport<
  TransportType extends
    | JSONMessageTransportQueue
    | JSONMessageTransportExchange,
> = {
  /** Channel used for connection */
  channel: amqp.Channel;
} & TransportType;

/**
 * Shorthand to send data as JSON to a queue or exchange
 *
 * @param transport Transport options
 * @param content The data
 * @param options The options
 *
 * @returns Information about data
 */
export function sendJSONMessage<DataType>(
  transport: JSONMessageTransport<
    JSONMessageTransportQueue | JSONMessageTransportExchange
  >,
  content: DataType,
  opts?: Omit<amqp.Options.Publish, 'contentType'>
): { sent: boolean; size: number } {
  const options: amqp.Options.Publish = {
    ...opts,
    contentType: 'application/json',
  };

  const buf = Buffer.from(JSON.stringify(content));

  let sent = false;
  if ('queue' in transport) {
    const { name } = transport.queue;
    sent = transport.channel.sendToQueue(name, buf, options);
  }
  if ('exchange' in transport) {
    const { name, routingKey } = transport.exchange;
    sent = transport.channel.publish(name, routingKey, buf, options);
  }

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
export function parseJSONMessage<DataType>(
  msg: amqp.ConsumeMessage,
  schema: z.ZodSchema<DataType>
): { data?: DataType; raw: unknown; parseError?: unknown } {
  const raw = JSON.parse(msg.content.toString());
  let data: DataType;
  try {
    data = schema.parse(raw);
  } catch (parseError) {
    return { raw, parseError };
  }
  return { data, raw };
}

export * as rabbitmq from 'amqplib';
