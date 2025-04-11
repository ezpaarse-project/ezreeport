import type { Logger } from '@ezreeport/logger';
import { parseJSONMessage, sendJSONToQueue, type rabbitmq } from '@ezreeport/rabbitmq';

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

  const alreadySeenMessages = new Set<string>();

  await channel.prefetch(1);

  const executeMethod = async (methodName: string, params: unknown[]) => {
    const method = router[methodName];

    logger.debug({
      msg: 'Executing method',
      methodName,
      params,
    });
    const start = process.uptime();
    try {
      const result = await method(...params);
      logger.trace({
        msg: 'Method executed',
        methodName,
        params,
        duration: process.uptime() - start,
        durationUnit: 's',
      });

      return result;
    } catch (err) {
      logger.error({
        msg: 'Failed to execute method',
        methodName,
        params,
        duration: process.uptime() - start,
        durationUnit: 's',
        err,
      });

      if (err instanceof Error) {
        throw err;
      }
      throw new Error(`${err}`);
    }
  };

  const onRPCMessage = async (msg: rabbitmq.ConsumeMessage | null) => {
    if (!msg) {
      return;
    }

    // Parse message
    const { data, raw, parseError } = parseJSONMessage(msg, RPCRequest);
    if (!data) {
      logger.error({
        msg: 'Invalid data',
        data: process.env.NODE_ENV === 'production' ? undefined : raw,
        err: parseError,
      });
      channel.nack(msg, undefined, false);
      return;
    }

    const { method: methodName, params } = data;

    if (!router[methodName]) {
      logger.warn({
        msg: 'Method not found',
        methodName,
        params,
      });
      channel.nack(msg, undefined, false);
      return;
    }

    const response: RPCResponseType = {};
    try {
      response.result = await executeMethod(methodName, params);
    } catch (err) {
      response.error = (err instanceof Error ? err.message : `${err}`) || 'Unknown error';
    }

    // Method is successful but no result was found, we pass it to next one in queue
    if (response.error == null && response.result == null) {
      const alreadySeenMessage = alreadySeenMessages.has(msg.properties.correlationId);

      channel.nack(msg, undefined, !alreadySeenMessage);
      logger.debug({
        msg: 'Result not found, requeuing request',
        methodName,
        params,
        correlationId: msg.properties.correlationId,
      });

      alreadySeenMessages.add(msg.properties.correlationId);
      return;
    }

    const { size } = sendJSONToQueue(
      channel,
      msg.properties.replyTo,
      response,
      { correlationId: msg.properties.correlationId },
    );
    logger.debug({
      msg: 'Result sent',
      methodName,
      params,
      size,
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
  await channel.consume(rpcQueue.queue, (m) => onRPCMessage(m));

  logger.debug('RPC server setup');
}
