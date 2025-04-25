import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:stream';

import type { Logger } from '@ezreeport/logger';
import {
  parseJSONMessage,
  publishJSONToExchange,
  sendJSONToQueue,
  type rabbitmq,
} from '@ezreeport/rabbitmq';

import { RPCResponse, type RPCResponseType, type RPCRequestType } from './types';
import { setIdleTimeout } from './common';

type OnMessageFnc = (
  msg: rabbitmq.ConsumeMessage,
  data: RPCResponseType,
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
    const { data, raw, parseError } = parseJSONMessage(msg, RPCResponse);
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

export function setupRPCClient(channel: rabbitmq.Channel, queueName: string, appLogger: Logger) {
  const logger = appLogger.child({ scope: 'rpc.client', queue: queueName });

  const exchangeName = `${queueName}:all`;
  channel.assertExchange(exchangeName, 'fanout', { durable: false })
    .then((exchange) => {
      logger.debug({
        msg: 'RPC client setup',
        ...exchange,
        queueName,
      });
    });

  return {
    callAll: async (method: string, ...params: unknown[]): Promise<(unknown | Error)[]> => {
      const events = new EventEmitter();
      const results: (unknown | Error)[] = [];

      let replyTo: string | undefined;

      const timeout = setIdleTimeout(async () => {
        if (!replyTo) {
          return;
        }

        if (results.length > 0) {
          events.emit('end', results);
        } else {
          events.emit('error', new Error('RPC Request timed out'));
        }
        await channel.deleteQueue(replyTo);
      }, false, 1000);

      const responseQueue = await setupResponseQueue(
        channel,
        logger,
        async (msg, data) => {
          timeout.reset();

          if (data.error) {
            results.push(new Error(data.error));
            channel.ack(msg);
            return;
          }

          results.push(data.result);
          channel.ack(msg);
        },
      );

      const promise = new Promise<(unknown | Error)[]>((resolve, reject) => {
        events.on('error', (err) => reject(err));
        events.on('end', () => resolve(results));
      });

      const { correlationId } = responseQueue;
      replyTo = responseQueue.replyTo;

      const { size } = publishJSONToExchange<RPCRequestType>(
        channel,
        exchangeName,
        '',
        { method, params, toAll: true },
        { correlationId, replyTo, expiration: timeout.duration },
      );
      logger.debug({
        msg: 'Request sent',
        method,
        params,
        size,
        sizeUnit: 'B',
      });

      return promise;
    },
    call: async (method: string, ...params: unknown[]): Promise<unknown> => {
      const events = new EventEmitter();

      let replyTo: string | undefined;

      const timeout = setIdleTimeout(async () => {
        if (!replyTo) {
          return;
        }

        events.emit('error', new Error('RPC Request timed out'));
        await channel.deleteQueue(replyTo);
      }, false);

      const responseQueue = await setupResponseQueue(
        channel,
        logger,
        async (msg, data) => {
          timeout.stop();

          if (data.error) {
            events.emit('error', new Error(data.error));
            channel.ack(msg);
            return;
          }

          if (replyTo) {
            await channel.deleteQueue(replyTo);
            events.emit('end', data.result);
            channel.ack(msg);
          }
        },
      );

      const promise = new Promise<unknown>((resolve, reject) => {
        events.on('error', (err) => reject(err));
        events.on('end', (data) => resolve(data));
      });

      const { correlationId } = responseQueue;
      replyTo = responseQueue.replyTo;

      const { size } = sendJSONToQueue<RPCRequestType>(
        channel,
        queueName,
        { method, params },
        { correlationId, replyTo, expiration: timeout.duration },
      );
      logger.debug({
        msg: 'Request sent',
        method,
        params,
        size,
        sizeUnit: 'B',
      });

      timeout.start();

      return promise;
    },
  };
}

export type RPCClient = ReturnType<typeof setupRPCClient>;
