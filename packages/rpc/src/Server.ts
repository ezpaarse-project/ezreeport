import type { Logger } from '@ezreeport/logger';
import {
  type JSONMessageTransport,
  type JSONMessageTransportQueue,
  parseJSONMessage,
  type rabbitmq,
  sendJSONMessage,
} from '@ezreeport/rabbitmq';

import { RPCRequest, type RPCRequestType, type RPCResponseType } from './types';

export type RPCServerRouter = Record<
  string,
  // oxlint-disable-next-line no-explicit-any
  (...args: any[]) => Promise<unknown> | unknown
>;

type RPCServerTransport = JSONMessageTransport<JSONMessageTransportQueue>;

export class RPCServer {
  private logger: Logger;

  private transport: Promise<RPCServerTransport>;

  private alreadySeenMessages = new Set<string>();

  constructor(
    channel: rabbitmq.Channel,
    queueName: string,
    appLogger: Logger,
    private router: RPCServerRouter
  ) {
    this.logger = appLogger.child({ queue: queueName, scope: 'rpc.server' });

    this.transport = this.assertTransport(channel, queueName);
  }

  private async assertTransport(
    channel: rabbitmq.Channel,
    queueName: string
  ): Promise<RPCServerTransport> {
    try {
      await channel.prefetch(1);

      // Create global rpc queue
      const rpcQueue = await channel.assertQueue(queueName, { durable: true });
      this.logger.debug({
        msg: 'Queue created',
        ...rpcQueue,
      });

      // Consume global rpc queue
      await channel.consume(rpcQueue.queue, (msg) => {
        if (msg) {
          this.onRPCMessage(msg);
        }
      });

      // Create specific rpc queue
      const randomQueue = await channel.assertQueue('', {
        durable: false,
        exclusive: true,
      });
      const exchangeName = `${queueName}:all`;
      const rpcExchange = await channel.assertExchange(exchangeName, 'fanout', {
        durable: false,
      });
      await channel.bindQueue(randomQueue.queue, exchangeName, '');
      this.logger.debug({
        msg: 'Exchange created',
        ...rpcExchange,
        ...randomQueue,
      });

      // Consume specific rpc queue
      await channel.consume(randomQueue.queue, (msg) => {
        if (msg) {
          this.onRPCMessage(msg);
        }
      });

      this.logger.debug('RPC server setup');

      return {
        channel,
        queue: { name: queueName },
      };
    } catch (error) {
      this.logger.error({ err: error, msg: "Couldn't setup RPC server" });
      throw error;
    }
  }

  private async executeMethod(
    methodName: string,
    params: unknown[]
  ): Promise<unknown> {
    const method = this.router[methodName];

    this.logger.debug({
      methodName,
      msg: 'Executing method',
      params,
    });
    const start = process.uptime();
    try {
      const result = await method(...params);
      this.logger.trace({
        duration: process.uptime() - start,
        durationUnit: 's',
        methodName,
        msg: 'Method executed',
        params,
      });

      return result;
    } catch (error) {
      this.logger.error({
        duration: process.uptime() - start,
        durationUnit: 's',
        err: error,
        methodName,
        msg: 'Failed to execute method',
        params,
      });

      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`${error}`, { cause: error });
    }
  }

  private async destroyMessage(
    request: RPCRequestType,
    msg: rabbitmq.ConsumeMessage
  ): Promise<void> {
    const { channel } = await this.transport;

    // If message is spread, ignore
    const alreadySeenMessage =
      request.toAll ||
      this.alreadySeenMessages.has(msg.properties.correlationId);

    channel.nack(msg, undefined, !alreadySeenMessage);
    this.logger.debug({
      correlationId: msg.properties.correlationId,
      method: request.method,
      msg: 'Result not found, requeuing request',
      params: request.params,
    });

    this.alreadySeenMessages.add(msg.properties.correlationId);
  }

  private getMethodOfMessage(
    request: RPCRequestType
  ): RPCServerRouter[string] | undefined {
    if (!this.router[request.method]) {
      this.logger.warn({
        method: request.method,
        msg: 'Method not found',
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
    } = parseJSONMessage(msg, RPCRequest);
    if (!request) {
      this.logger.error({
        data: process.env.NODE_ENV === 'production' ? undefined : raw,
        err: parseError,
        msg: 'Invalid data',
      });
      channel.nack(msg, undefined, false);
      return;
    }

    const method = this.getMethodOfMessage(request);
    if (!method) {
      channel.nack(msg, undefined, false);
      return;
    }

    const response: RPCResponseType = {};
    try {
      response.result = await this.executeMethod(
        request.method,
        request.params
      );
    } catch (error) {
      response.error =
        (error instanceof Error ? error.message : `${error}`) ||
        'Unknown error';
    }

    // Method is successful but no result was found, we pass it to next one in queue
    if (response.error == null && response.result == null) {
      await this.destroyMessage(request, msg);
      return;
    }

    const { size } = sendJSONMessage(
      { channel, queue: { name: msg.properties.replyTo } },
      response,
      { correlationId: msg.properties.correlationId }
    );
    this.logger.debug({
      method: request.method,
      msg: 'Result sent',
      params: request.params,
      size,
      sizeUnit: 'B',
    });
    channel.ack(msg);
  }
}
