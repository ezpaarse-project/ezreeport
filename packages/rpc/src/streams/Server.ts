import type { Readable, Writable } from 'node:stream';

import type { Logger } from '@ezreeport/logger';
import {
  parseJSONMessage,
  sendJSONMessage,
  type rabbitmq,
  type JSONMessageTransport,
  type JSONMessageTransportQueue,
} from '@ezreeport/rabbitmq';

import { readStreamFromQueue, writeStreamIntoQueue } from './queue-streams';
import {
  RPCStreamRequest,
  type RPCWriteStreamRequestType,
  type RPCReadStreamRequestType,
  type RPCStreamResponseType,
  type RPCStreamRequestType,
} from './types';

export type RPCStreamRouter = {
  // oxlint-disable-next-line no-explicit-any
  createWriteStream?: (...args: any[]) => Writable | Promise<Writable>;
  // oxlint-disable-next-line no-explicit-any
  createReadStream?: (...args: any[]) => Readable | Promise<Readable>;
};

type RPCServerTransport = JSONMessageTransport<JSONMessageTransportQueue>;

export class RPCStreamServer {
  private logger: Logger;

  private transport: Promise<RPCServerTransport>;

  private alreadySeenMessages = new Set<string>();

  constructor(
    channel: rabbitmq.Channel,
    queueName: string,
    appLogger: Logger,
    private router: RPCStreamRouter,
    private opts?: { compression?: boolean }
  ) {
    this.logger = appLogger.child({
      scope: 'rpc-stream.server',
      queue: queueName,
    });

    this.transport = this.assertTransport(channel, queueName);
  }

  private async assertTransport(
    channel: rabbitmq.Channel,
    queueName: string
  ): Promise<RPCServerTransport> {
    try {
      await channel.prefetch(1);

      // Create rpc queue
      const rpcQueue = await channel.assertQueue(queueName, {
        durable: false,
      });
      this.logger.debug({
        msg: 'Queue created',
        ...rpcQueue,
      });

      // Consume rpc queue
      await channel.consume(rpcQueue.queue, (msg) => {
        if (msg) {
          this.onRPCMessage(msg);
        }
      });

      this.logger.debug('RPC stream server setup');

      return {
        channel: channel,
        queue: { name: queueName },
      };
    } catch (err) {
      this.logger.error({ msg: "Couldn't setup RPC stream server", err });
      throw err;
    }
  }

  private async onWriteRequest(
    request: RPCWriteStreamRequestType
  ): Promise<{ reason?: Error }> {
    if (!this.router.createWriteStream) {
      throw new Error('Method not found');
    }

    const { channel } = await this.transport;

    let stream;
    try {
      stream = await this.router.createWriteStream(...request.params);
    } catch (err) {
      return {
        reason:
          err instanceof Error ? err : new Error('Failed to create stream'),
      };
    }

    // Read data from queue and write it to the stream
    await readStreamFromQueue(
      channel,
      request.dataQueue,
      stream,
      this.logger,
      this.opts?.compression !== false
    );

    return {};
  }

  private async onReadRequest(
    request: RPCReadStreamRequestType
  ): Promise<{ dataQueue?: string; reason?: Error }> {
    if (!this.router.createReadStream) {
      throw new Error('Method not found');
    }

    const { channel } = await this.transport;

    let stream;
    try {
      stream = await this.router.createReadStream(...request.params);
    } catch (err) {
      return {
        reason:
          err instanceof Error ? err : new Error('Failed to create stream'),
      };
    }

    // Read data from stream and write it to the queue
    const { dataQueue } = await writeStreamIntoQueue(
      channel,
      stream,
      this.logger,
      this.opts?.compression !== false
    );

    return { dataQueue };
  }

  private getMethodOfMessage(
    request: RPCStreamRequestType
  ): RPCStreamRouter['createReadStream' | 'createWriteStream'] | undefined {
    if (!this.router[request.method]) {
      this.logger.warn({
        msg: 'Method not found',
        method: request.method,
        params: request.params,
      });
      return;
    }

    return this.router[request.method];
  }

  private async onRPCMessage(msg: rabbitmq.ConsumeMessage): Promise<void> {
    const { channel } = await this.transport;

    // Parse message
    const {
      data: request,
      raw,
      parseError,
    } = parseJSONMessage(msg, RPCStreamRequest);
    if (!request) {
      this.logger.error({
        msg: 'Invalid data',
        data: process.env.NODE_ENV === 'production' ? undefined : raw,
        err: parseError,
      });
      channel.nack(msg, undefined, false);
      return;
    }

    const method = this.getMethodOfMessage(request);
    if (!method) {
      channel.nack(msg, undefined, false);
      return;
    }

    let replyTo: string | undefined;
    const response: RPCStreamResponseType = { result: false };

    try {
      this.logger.debug({
        msg: 'Processing request',
        methodName: request.method,
        params: request.params,
      });

      let requeueReason: Error | undefined;

      if (request.method === 'createReadStream') {
        const { dataQueue, reason } = (await this.onReadRequest(request)) ?? {};
        requeueReason = reason;
        replyTo = dataQueue;
      } else {
        const { reason } = await this.onWriteRequest(request);
        requeueReason = reason;
      }

      // Ignore so another worker can retry
      if (requeueReason) {
        const alreadySeenMessage = this.alreadySeenMessages.has(
          msg.properties.correlationId
        );

        this.logger.error({
          msg: 'Error while processing streams',
          methodName: request.method,
          params: request.params,
          correlationId: msg.properties.correlationId,
          err: requeueReason,
        });

        channel.nack(msg, undefined, !alreadySeenMessage);
        this.logger.debug({
          msg: 'Result not found, requeuing request',
          methodName: request.method,
          params: request.params,
          correlationId: msg.properties.correlationId,
        });

        this.alreadySeenMessages.add(msg.properties.correlationId);
        return;
      }

      response.result = true;
    } catch (err) {
      this.logger.error({
        msg: 'Error while processing streams',
        methodName: request.method,
        params: request.params,
        err,
      });

      response.result = false;
      response.error = err instanceof Error ? err.message : `${err}`;
    }

    const { size } = sendJSONMessage(
      { channel: channel, queue: { name: msg.properties.replyTo } },
      response,
      { correlationId: msg.properties.correlationId, replyTo }
    );
    this.logger.debug({
      msg: 'Result sent',
      method: request.method,
      params: request.params,
      size,
      sizeUnit: 'B',
    });
    channel.ack(msg);
  }
}
