import { randomUUID } from 'node:crypto';

import type { Logger } from '@ezreeport/logger';
import { parseJSONMessage, sendJSONToQueue, type rabbitmq } from '@ezreeport/rabbitmq';

import { RPCResponse, type RPCRequestType } from './types';

export function setupRPCClient(channel: rabbitmq.Channel, queueName: string, appLogger: Logger) {
  const timeout = 15000;
  const logger = appLogger.child({ scope: 'rpc.client', queue: queueName });
  logger.debug('RPC client setup');

  return {
    call: async (method: string, ...params: unknown[]): Promise<unknown> => {
      const { queue: responseQueue } = await channel.assertQueue(
        '',
        { exclusive: true, durable: false },
      );
      const correlationId = randomUUID();

      const promise = new Promise<unknown>((resolve, reject) => {
        channel.consume(
          responseQueue,
          async (msg) => {
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

            channel.ack(msg);

            if (data.error) {
              reject(new Error(data.error));
              return;
            }

            await channel.deleteQueue(responseQueue);
            resolve(data.result);
          },
        );

        setTimeout(async () => {
          await channel.deleteQueue(responseQueue);
          reject(new Error("Timeout, couldn't get response from RPC server"));
        }, timeout);
      });

      const { size } = sendJSONToQueue<RPCRequestType>(
        channel,
        queueName,
        { method, params },
        { correlationId, replyTo: responseQueue, expiration: timeout },
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
  };
}

export type RPCClient = ReturnType<typeof setupRPCClient>;
