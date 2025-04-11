import { PassThrough, type Readable, type Writable } from 'node:stream';
import { randomUUID } from 'node:crypto';

import type { Logger } from '@ezreeport/logger';
import { parseJSONMessage, rabbitmq, sendJSONToQueue } from '@ezreeport/rabbitmq';

import { setIdleTimeout } from '../common';
import { readStreamFromQueue, writeStreamIntoQueue } from './common';
import { RPCStreamResponse, type RPCStreamResponseType, type RPCStreamRequestType } from './types';

type OnMessageFnc = (
  msg: rabbitmq.ConsumeMessage,
  data: RPCStreamResponseType,
) => Promise<void> | void;

async function setupResponseQueue(
  channel: rabbitmq.Channel,
  logger: Logger,
  onMessage: OnMessageFnc,
) {
  const correlationId = randomUUID();
  const { queue: responseQueue } = await channel.assertQueue('', {
    exclusive: true,
    durable: false,
  });

  await channel.consume(responseQueue, async (msg) => {
    if (!msg) {
      return;
    }
    if (msg.properties.correlationId !== correlationId) {
      channel.nack(msg);
      return;
    }

    // Parse message
    const { data, raw, parseError } = parseJSONMessage(msg, RPCStreamResponse);
    if (!data) {
      logger.error({
        msg: 'Invalid data',
        data: process.env.NODE_ENV === 'production' ? undefined : raw,
        err: parseError,
      });
      channel.nack(msg, undefined, false);
      return;
    }

    await onMessage(msg, data);
  });

  return { correlationId, replyTo: responseQueue };
}

export function setupRPCStreamClient(
  channel: rabbitmq.Channel,
  queueName: string,
  appLogger: Logger,
  opts?: { compression?: boolean },
) {
  const logger = appLogger.child({ scope: 'rpc-stream.client', queue: queueName });
  logger.debug('RPC client setup');

  return {
    requestWriteStream: async (...params: unknown[]): Promise<Writable> => {
      const stream = new PassThrough();

      // Read data from stream and write it to the queue
      const { dataQueue } = await writeStreamIntoQueue(
        channel,
        stream,
        logger,
        opts?.compression !== false,
      );

      let replyTo: string | undefined;

      const timeout = setIdleTimeout(async () => {
        if (!replyTo) {
          return;
        }

        stream.emit('error', new Error('RPC Request timed out'));
        await channel.deleteQueue(replyTo);
      }, false);

      // Wait and handle response
      const responseQueue = await setupResponseQueue(
        channel,
        logger,
        async (msg, _data) => {
          timeout.stop();

          // TODO: handle error ?

          if (replyTo) {
            await channel.deleteQueue(replyTo);
          }
          channel.ack(msg);
        },
      );

      const { correlationId } = responseQueue;
      replyTo = responseQueue.replyTo;

      // Send request
      const { size } = sendJSONToQueue<RPCStreamRequestType>(
        channel,
        queueName,
        { method: 'createWriteStream', params, dataQueue },
        { correlationId, replyTo, expiration: timeout.duration },
      );
      logger.debug({
        msg: 'Request sent',
        method: 'createWriteStream',
        params,
        size,
        sizeUnit: 'B',
      });

      timeout.start();

      return stream;
    },

    requestReadStream: async (...params: unknown[]): Promise<Readable> => {
      const stream = new PassThrough();

      let replyTo: string | undefined;

      const timeout = setIdleTimeout(async () => {
        if (!replyTo) {
          return;
        }

        stream.emit('error', new Error('RPC Request timed out'));
        await channel.deleteQueue(replyTo);
      }, false);

      // Wait and handle response
      const responseQueue = await setupResponseQueue(
        channel,
        logger,
        async (msg, data) => {
          timeout.stop();

          if (data.error) {
            stream.emit('error', new Error(data.error));
          }

          if (data.result) {
            // Read data from stream and write it to the queue
            await readStreamFromQueue(
              channel,
              msg.properties.replyTo,
              stream,
              logger,
              opts?.compression !== false,
            );
          }

          if (replyTo) {
            await channel.deleteQueue(replyTo);
          }
          channel.ack(msg);
        },
      );

      const { correlationId } = responseQueue;
      replyTo = responseQueue.replyTo;

      // Send request
      const { size } = sendJSONToQueue<RPCStreamRequestType>(
        channel,
        queueName,
        { method: 'createReadStream', params },
        { correlationId, replyTo, expiration: timeout.duration },
      );
      logger.debug({
        msg: 'Request sent',
        method: 'createReadStream',
        params,
        size,
        sizeUnit: 'B',
      });

      timeout.start();

      return stream;
    },
  };
}

export type RPCStreamClient = ReturnType<typeof setupRPCStreamClient>;
