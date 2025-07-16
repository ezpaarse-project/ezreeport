import type { Logger } from '@ezreeport/logger';
import {
  parseJSONMessage,
  sendJSONMessage,
  type rabbitmq,
  type JSONMessageTransport,
  type JSONMessageTransportQueue,
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
    this.logger = appLogger.child({ scope: 'rpc.server', queue: queueName });

    this.transport = this.assertTransport(channel, queueName);
  }

  private async assertTransport(
    channel: rabbitmq.Channel,
    queueName: string
  ): Promise<RPCServerTransport> {
    try {
      await channel.prefetch(1);

      // Create global rpc queue
      const rpcQueue = await channel.assertQueue(queueName, { durable: false });
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
        exclusive: true,
        durable: false,
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
        channel: channel,
        queue: { name: queueName },
      };
    } catch (err) {
      this.logger.error({ msg: "Couldn't setup RPC server", err });
      throw err;
    }
  }

  private async executeMethod(
    methodName: string,
    params: unknown[]
  ): Promise<unknown> {
    const method = this.router[methodName];

    this.logger.debug({
      msg: 'Executing method',
      methodName,
      params,
    });
    const start = process.uptime();
    try {
      const result = await method(...params);
      this.logger.trace({
        msg: 'Method executed',
        methodName,
        params,
        duration: process.uptime() - start,
        durationUnit: 's',
      });

      return result;
    } catch (err) {
      this.logger.error({
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
      msg: 'Result not found, requeuing request',
      method: request.method,
      params: request.params,
      correlationId: msg.properties.correlationId,
    });

    this.alreadySeenMessages.add(msg.properties.correlationId);
  }

  private getMethodOfMessage(
    request: RPCRequestType
  ): RPCServerRouter[string] | undefined {
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
    } = parseJSONMessage(msg, RPCRequest);
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

    const response: RPCResponseType = {};
    try {
      response.result = await this.executeMethod(
        request.method,
        request.params
      );
    } catch (err) {
      response.error =
        (err instanceof Error ? err.message : `${err}`) || 'Unknown error';
    }

    // Method is successful but no result was found, we pass it to next one in queue
    if (response.error == null && response.result == null) {
      await this.destroyMessage(request, msg);
      return;
    }

    const { size } = sendJSONMessage(
      { channel: channel, queue: { name: msg.properties.replyTo } },
      response,
      { correlationId: msg.properties.correlationId }
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
