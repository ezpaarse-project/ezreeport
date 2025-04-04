import type { Logger } from '@ezreeport/logger';

import type rabbitmq from 'amqplib';

import { RPCRequest, type RPCResponseType } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RPCServerRouter = Record<string, (...args: any[]) => Promise<unknown> | unknown>;

export async function setupRPCServer(
  channel: rabbitmq.Channel,
  queueName: string,
  router: RPCServerRouter,
  appLogger: Logger,
) {
  const logger = appLogger.child({ scope: 'rpc.server', queue: queueName });

  const onRPCMessage = async (msg: rabbitmq.ConsumeMessage | null) => {
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
      channel.nack(msg, undefined, false);
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
      channel.nack(msg, undefined, false);
      return;
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
    channel.ack(msg);
  };

  // Create rpc queue
  const rpcQueue = await channel.assertQueue(queueName, { durable: false });
  logger.debug({
    msg: 'Queue created',
    ...rpcQueue,
  });

  // Consume rpc queue
  channel.consume(rpcQueue.queue, (m) => onRPCMessage(m));

  logger.debug('RPC server setup');
}
