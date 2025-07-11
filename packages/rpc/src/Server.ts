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

export class RPCServer {
  protected logger: Logger;

  protected transport: Promise<JSONMessageTransport<JSONMessageTransportQueue>>;

  protected alreadySeenMessages = new Set<string>();

  constructor(
    protected channel: rabbitmq.Channel,
    protected queueName: string,
    appLogger: Logger,
    protected router: RPCServerRouter
  ) {
    this.logger = appLogger.child({ scope: 'rpc.server', queue: queueName });

    this.transport = this.assertTransport();
  }

  protected async assertTransport(): Promise<
    JSONMessageTransport<JSONMessageTransportQueue>
  > {
    await this.channel.prefetch(1);

    // Create rpc queue
    const rpcQueue = await this.channel.assertQueue(this.queueName, {
      durable: false,
    });
    this.logger.debug({
      msg: 'Queue created',
      ...rpcQueue,
    });

    // Consume rpc queue
    await this.channel.consume(rpcQueue.queue, (msg) => {
      if (msg) {
        this.onRPCMessage(msg);
      }
    });

    this.logger.debug('RPC stream server setup');

    return {
      channel: this.channel,
      queue: { name: this.queueName },
    };
  }

  protected async executeMethod(
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

  protected destroyMessage(
    request: RPCRequestType,
    msg: rabbitmq.ConsumeMessage
  ): void {
    // If message is spread, ignore
    const alreadySeenMessage =
      request.toAll ||
      this.alreadySeenMessages.has(msg.properties.correlationId);

    this.channel.nack(msg, undefined, !alreadySeenMessage);
    this.logger.debug({
      msg: 'Result not found, requeuing request',
      method: request.method,
      params: request.params,
      correlationId: msg.properties.correlationId,
    });

    this.alreadySeenMessages.add(msg.properties.correlationId);
  }

  protected getMethodOfMessage(
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

  protected async onRPCMessage(msg: rabbitmq.ConsumeMessage): Promise<void> {
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
      this.channel.nack(msg, undefined, false);
      return;
    }

    const method = this.getMethodOfMessage(request);
    if (!method) {
      this.channel.nack(msg, undefined, false);
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
      this.destroyMessage(request, msg);
      return;
    }

    const { size } = sendJSONMessage(
      { channel: this.channel, queue: { name: msg.properties.replyTo } },
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
    this.channel.ack(msg);
  }
}
