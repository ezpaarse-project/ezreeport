import { randomUUID } from 'node:crypto';

import type { Channel, ConsumeMessage } from 'amqplib';
import type { Logger } from 'pino';

import { RPCRequest, RPCResponse, type RPCResponseType } from '../types/queues';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RPCServerRouter = Record<string, (...args: any[]) => Promise<unknown> | unknown>;

export async function setupRPCServer(
  channel: Channel,
  queueName: string,
  router: RPCServerRouter,
  appLogger: Logger,
) {
  const logger = appLogger.child({ scope: 'rpc.server', queue: queueName });

  const onRPCMessage = async (msg: ConsumeMessage | null) => {
    if (!msg) {
      return;
    }

    // Parse message
    const raw = JSON.parse(msg.content.toString());
    let methodName;
    let params;
    try {
      ({ method: methodName, params } = await RPCRequest.parseAsync(raw));
    } catch (error) {
      logger.error({
        msg: 'Invalid data',
        data: process.env.NODE_ENV === 'production' ? undefined : raw,
        error,
      });
      return;
    }

    let result: RPCResponseType['result'];
    let error: RPCResponseType['error'];
    const method = router[methodName];

    if (method) {
      logger.debug({
        msg: 'Executing method',
        methodName,
        params,
      });
      const start = process.uptime();
      try {
        result = await method(...params);
        logger.trace({
          msg: 'Method executed',
          methodName,
          params,
          duration: process.uptime() - start,
          durationUnit: 's',
        });
      } catch (err) {
        error = err instanceof Error ? err.message : `${err}`;
        logger.error({
          msg: 'Failed to execute method',
          methodName,
          params,
          duration: process.uptime() - start,
          durationUnit: 's',
          err,
        });
      }
    } else {
      error = `Method ${methodName} not found`;
      logger.warn({
        msg: 'Method not found',
        methodName,
        params,
      });
    }

    const buf = Buffer.from(JSON.stringify({ result, error }));
    // Send result
    channel.sendToQueue(
      msg.properties.replyTo,
      buf,
      { correlationId: msg.properties.correlationId },
    );
    logger.debug({
      msg: 'Result sent',
      methodName,
      params,
      size: buf.byteLength,
      sizeUnit: 'B',
    });
  };

  // Create rpc queue
  const rpcQueue = await channel.assertQueue(queueName, { durable: false });
  logger.debug({
    msg: 'Queue created',
    ...rpcQueue,
  });

  // Consume rpc queue
  channel.consume(
    rpcQueue.queue,
    (m) => onRPCMessage(m).then(() => m && channel!.ack(m)),
    { noAck: false },
  );

  logger.debug('RPC server setup');
}

export function setupRPCClient(channel: Channel, queueName: string, appLogger: Logger) {
  const logger = appLogger.child({ scope: 'rpc.client', queue: queueName });
  logger.debug('RPC client setup');

  return {
    call: async (method: string, ...params: unknown[]): Promise<unknown> => {
      if (!channel) {
        throw new Error('rpc is not initialized');
      }

      const { queue: responseQueue } = await channel.assertQueue('', { exclusive: true });
      const correlationId = randomUUID();

      const promise = new Promise<unknown>((resolve, reject) => {
        channel!.consume(
          responseQueue,
          (msg) => {
            if (!msg || msg.properties.correlationId !== correlationId) {
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
              return;
            }

            if (data.error) {
              reject(new Error(data.error));
              return;
            }

            resolve(data.result);
          },
        );

        setTimeout(() => {
          reject(new Error("Timeout, couldn't get response from RPC server"));
        }, 15000);
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
