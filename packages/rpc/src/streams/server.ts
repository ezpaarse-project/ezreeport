import type { Readable, Writable } from 'node:stream';

import type { Logger } from '@ezreeport/logger';
import type { rabbitmq } from '@ezreeport/rabbitmq';

import { readStreamFromQueue, writeStreamIntoQueue } from './common';
import {
  RPCStreamRequest,
  type RPCWriteStreamRequestType,
  type RPCReadStreamRequestType,
  type RPCStreamResponseType,
} from './types';

export type RPCStreamRouter = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createWriteStream?: (...args: any[]) => Writable,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createReadStream?: (...args: any[]) => Readable,
};

export async function setupRPCStreamServer(
  channel: rabbitmq.Channel,
  queueName: string,
  router: RPCStreamRouter,
  appLogger: Logger,
  opts?: { compression?: boolean },
) {
  const logger = appLogger.child({ scope: 'rpc-stream.server', queue: queueName });

  const alreadySeenMessages = new Set<string>();

  const onWriteRequest = async (request: RPCWriteStreamRequestType) => {
    if (!router.createWriteStream) {
      throw new Error('Method not found');
    }

    let stream;
    try {
      stream = router.createWriteStream(...request.params);
    } catch (err) {
      return {
        reason: err instanceof Error ? err : new Error('Failed to create stream'),
      };
    }

    // Read data from queue and write it to the stream
    await readStreamFromQueue(
      channel,
      request.dataQueue,
      stream,
      logger,
      opts?.compression !== false,
    );

    return { };
  };

  const onReadRequest = async (request: RPCReadStreamRequestType) => {
    if (!router.createReadStream) {
      throw new Error('Method not found');
    }

    let stream;
    try {
      stream = router.createReadStream(...request.params);
    } catch (err) {
      return {
        reason: err instanceof Error ? err : new Error('Failed to create stream'),
      };
    }

    // Read data from stream and write it to the queue
    const { dataQueue } = await writeStreamIntoQueue(
      channel,
      stream,
      logger,
      opts?.compression !== false,
    );

    return { dataQueue };
  };

  const onRPCMessage = async (msg: rabbitmq.ConsumeMessage | null) => {
    if (!msg) {
      return;
    }

    // Parse message
    const raw = JSON.parse(msg.content.toString());
    let data;
    try {
      data = await RPCStreamRequest.parseAsync(raw);
    } catch (error) {
      logger.error({
        msg: 'Invalid data',
        data: process.env.NODE_ENV === 'production' ? undefined : raw,
        error,
      });
      channel.nack(msg, undefined, false);
      return;
    }

    let replyTo: string | undefined;
    const response: RPCStreamResponseType = { result: false };

    try {
      logger.debug({
        msg: 'Processing request',
        methodName: data.method,
        params: data.params,
      });

      let requeueReason: Error | undefined;

      if (data.method === 'createReadStream') {
        const { dataQueue, reason } = await onReadRequest(data) ?? {};
        requeueReason = reason;
        replyTo = dataQueue;
      } else {
        const { reason } = await onWriteRequest(data);
        requeueReason = reason;
      }

      // Ignore so another worker can retry
      if (requeueReason) {
        const alreadySeenMessage = alreadySeenMessages.has(msg.properties.correlationId);

        channel.nack(msg, undefined, !alreadySeenMessage);
        logger.debug({
          msg: 'Result not found, requeuing request',
          methodName: data.method,
          params: data.params,
          correlationId: msg.properties.correlationId,
        });

        alreadySeenMessages.add(msg.properties.correlationId);
        return;
      }

      response.result = true;
    } catch (err) {
      logger.error({
        msg: 'Error while processing streams',
        methodName: data.method,
        params: data.params,
        err,
      });

      response.result = false;
      response.error = err instanceof Error ? err.message : `${err}`;
    }

    const buf = Buffer.from(JSON.stringify(response));
    // Send result
    channel.sendToQueue(
      msg.properties.replyTo,
      buf,
      { correlationId: msg.properties.correlationId, replyTo },
    );
    logger.debug({
      msg: 'Result sent',
      methodName: data.method,
      params: data.params,
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
  await channel.consume(rpcQueue.queue, (m) => onRPCMessage(m));

  logger.debug('RPC stream server setup');
}
