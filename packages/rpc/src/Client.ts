import EventEmitter from 'node:events';
import { randomUUID } from 'node:crypto';

import type { Logger } from '@ezreeport/logger';
import {
  type rabbitmq,
  type JSONMessageTransport,
  type JSONMessageTransportExchange,
  type JSONMessageTransportQueue,
  parseJSONMessage,
  sendJSONMessage,
} from '@ezreeport/rabbitmq';

import { setIdleTimeout } from './timeout';

import {
  type RPCRequestType,
  RPCResponse,
  type RPCResponseType,
} from './types';

type OnMessageFnc<ResponseType extends RPCResponseType> = (
  msg: rabbitmq.ConsumeMessage,
  data: ResponseType
) => Promise<void> | void;

type ResponseQueue = {
  correlationId: string;
  replyTo: string;
};

type RPCClientTransport = JSONMessageTransport<
  JSONMessageTransportQueue & JSONMessageTransportExchange
>;

export class RPCClient {
  private logger: Logger;

  private transport: Promise<RPCClientTransport>;

  constructor(channel: rabbitmq.Channel, queueName: string, appLogger: Logger) {
    this.logger = appLogger.child({ scope: 'rpc.client', queue: queueName });

    this.transport = this.assertTransport(channel, queueName);
  }

  private async assertTransport(
    channel: rabbitmq.Channel,
    queueName: string
  ): Promise<RPCClientTransport> {
    try {
      const { exchange: name, ...exchange } = await channel.assertExchange(
        `${queueName}:all`,
        'fanout',
        { durable: false }
      );
      this.logger.debug({
        msg: 'RPC client setup',
        ...exchange,
        exchange: name,
        queueName: queueName,
      });

      return {
        channel: channel,
        queue: { name: queueName },
        exchange: { name, routingKey: '' },
      };
    } catch (err) {
      this.logger.error({ msg: "Couldn't setup RPC client", err });
      throw err;
    }
  }

  private async setupResponseQueue(
    onMessage: OnMessageFnc<RPCResponseType>
  ): Promise<ResponseQueue> {
    const { channel } = await this.transport;

    const correlationId = randomUUID();
    const { queue: responseQueue } = await channel.assertQueue('', {
      exclusive: true,
      durable: false,
    });

    await channel.consume(responseQueue, async (msg) => {
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
        this.logger.error({
          msg: 'Invalid data',
          data: process.env.NODE_ENV === 'production' ? undefined : raw,
          err: parseError,
        });
        channel.nack(msg, undefined, false);
        return;
      }

      await onMessage(msg, data);
    });

    return { correlationId, replyTo: responseQueue };
  }

  public async callAll(
    method: string,
    ...params: unknown[]
  ): Promise<(unknown | Error)[]> {
    const { channel, exchange } = await this.transport;

    const events = new EventEmitter();
    const results: (unknown | Error)[] = [];

    let replyTo: string | undefined;

    const timeout = setIdleTimeout(
      async () => {
        if (!replyTo) {
          return;
        }

        if (results.length > 0) {
          events.emit('end', results);
        } else {
          events.emit('error', new Error('RPC Request timed out'));
        }
        await channel.deleteQueue(replyTo);
      },
      false,
      1000
    );

    const responseQueue = await this.setupResponseQueue(async (msg, data) => {
      timeout.reset();

      if (data.error) {
        results.push(new Error(data.error));
        channel.ack(msg);
        return;
      }

      results.push(data.result);
      channel.ack(msg);
    });

    const promise = new Promise<(unknown | Error)[]>((resolve, reject) => {
      events.on('error', (err) => reject(err));
      events.on('end', () => resolve(results));
    });

    const { correlationId } = responseQueue;
    replyTo = responseQueue.replyTo;

    const { size } = sendJSONMessage<RPCRequestType>(
      { channel, exchange },
      { method, params, toAll: true },
      { correlationId, replyTo, expiration: timeout.duration }
    );
    this.logger.debug({
      msg: 'Request sent',
      method,
      params,
      size,
      sizeUnit: 'B',
    });

    timeout.start();

    return promise;
  }

  public async call(method: string, ...params: unknown[]): Promise<unknown> {
    const { channel, queue } = await this.transport;

    const events = new EventEmitter();

    let replyTo: string | undefined;

    const timeout = setIdleTimeout(async () => {
      if (!replyTo) {
        return;
      }

      events.emit('error', new Error('RPC Request timed out'));
      await channel.deleteQueue(replyTo);
    }, false);

    const responseQueue = await this.setupResponseQueue(async (msg, data) => {
      timeout.stop();

      if (data.error) {
        events.emit('error', new Error(data.error));
        channel.ack(msg);
        return;
      }

      if (replyTo) {
        await channel.deleteQueue(replyTo);
        events.emit('end', data.result);
        channel.ack(msg);
      }
    });

    const promise = new Promise<unknown>((resolve, reject) => {
      events.on('error', (err) => reject(err));
      events.on('end', (data) => resolve(data));
    });

    const { correlationId } = responseQueue;
    replyTo = responseQueue.replyTo;

    const { size } = sendJSONMessage<RPCRequestType>(
      { channel, queue },
      { method, params },
      { correlationId, replyTo, expiration: timeout.duration }
    );
    this.logger.debug({
      msg: 'Request sent',
      method,
      params,
      size,
      sizeUnit: 'B',
    });

    timeout.start();

    return promise;
  }
}
