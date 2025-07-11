import EventEmitter from 'node:events';

import type { Logger } from '@ezreeport/logger';
import type {
  rabbitmq,
  JSONMessageTransport,
  JSONMessageTransportExchange,
} from '@ezreeport/rabbitmq';

import {
  BaseRPCClient,
  type OnMessageFnc,
  type ResponseQueue,
} from './BaseClient';
import { setIdleTimeout } from './timeout';

import {
  type RPCRequestType,
  RPCResponse,
  type RPCResponseType,
} from './types';

export class RPCClient extends BaseRPCClient {
  protected transport: Promise<
    JSONMessageTransport<JSONMessageTransportExchange>
  >;

  constructor(channel: rabbitmq.Channel, queueName: string, appLogger: Logger) {
    super(channel, queueName, appLogger);

    this.transport = this.assertTransport();
  }

  protected async assertTransport(): Promise<
    JSONMessageTransport<JSONMessageTransportExchange>
  > {
    try {
      const { exchange: name, ...exchange } = await this.channel.assertExchange(
        `${this.queueName}:all`,
        'fanout',
        { durable: false }
      );
      this.logger.debug({
        msg: 'RPC client setup',
        ...exchange,
        exchange: name,
        queueName: this.queueName,
      });

      return {
        channel: this.channel,
        exchange: { name, routingKey: '' },
      };
    } catch (err) {
      this.logger.error({ msg: "Couldn't setup RPC client", err });
      throw err;
    }
  }

  protected setupResponseQueue(
    onMessage: OnMessageFnc<RPCResponseType>
  ): Promise<ResponseQueue> {
    return super._setupResponseQueue(onMessage, RPCResponse);
  }

  protected override sendRequest(
    content: RPCRequestType,
    opts: Omit<rabbitmq.Options.Publish, 'contentType'>
  ): Promise<void> {
    return super._sendRequest(content, opts);
  }

  public async callAll(
    method: string,
    ...params: unknown[]
  ): Promise<(unknown | Error)[]> {
    // oxlint-disable-next-line unicorn/prefer-event-target
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
        await this.channel.deleteQueue(replyTo);
      },
      false,
      1000
    );

    const responseQueue = await this.setupResponseQueue((msg, data) => {
      timeout.reset();

      if (data.error) {
        results.push(new Error(data.error));
        this.channel.ack(msg);
        return;
      }

      results.push(data.result);
      this.channel.ack(msg);
    });

    // oxlint-disable-next-line promise/avoid-new
    const promise = new Promise<(unknown | Error)[]>((resolve, reject) => {
      events.on('error', (err) => reject(err));
      events.on('end', () => resolve(results));
    });

    const { correlationId } = responseQueue;
    replyTo = responseQueue.replyTo;

    await this.sendRequest(
      { method, params, toAll: true },
      { correlationId, replyTo, expiration: timeout.duration }
    );

    return promise;
  }

  public async call(method: string, ...params: unknown[]): Promise<unknown> {
    // oxlint-disable-next-line unicorn/prefer-event-target
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
        await this.channel.deleteQueue(replyTo);
      },
      false,
      1000
    );

    const responseQueue = await this.setupResponseQueue(async (msg, data) => {
      timeout.stop();

      if (data.error) {
        events.emit('error', new Error(data.error));
        this.channel.ack(msg);
        return;
      }

      if (replyTo) {
        await this.channel.deleteQueue(replyTo);
        events.emit('end', data.result);
        this.channel.ack(msg);
      }
    });

    // oxlint-disable-next-line promise/avoid-new
    const promise = new Promise<unknown>((resolve, reject) => {
      events.on('error', (err) => reject(err));
      events.on('end', (data) => resolve(data));
    });

    const { correlationId } = responseQueue;
    replyTo = responseQueue.replyTo;

    await this.sendRequest(
      { method, params },
      { correlationId, replyTo, expiration: timeout.duration }
    );

    timeout.start();

    return promise;
  }
}
