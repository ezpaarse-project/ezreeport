import { randomUUID } from 'node:crypto';

import type { Logger } from '@ezreeport/logger';
import type { rabbitmq } from '@ezreeport/rabbitmq';

import { RPCResponse } from './types';

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
            const raw = JSON.parse(msg.content.toString());
            let data;
            try {
              data = RPCResponse.parse(raw);
            } catch (error) {
              logger.error({
                msg: 'Invalid data',
                data: process.env.NODE_ENV === 'production' ? undefined : raw,
                error,
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

      const buf = Buffer.from(JSON.stringify({ method, params }));
      channel.sendToQueue(queueName, buf, { correlationId, replyTo: responseQueue });
      logger.debug({
        msg: 'Request sent',
        method,
        params,
        size: buf.byteLength,
        sizeUnit: 'B',
      });

      return promise;
    },
  };
}

export type RPCClient = ReturnType<typeof setupRPCClient>;
