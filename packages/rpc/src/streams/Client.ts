import { PassThrough, type Readable, type Writable } from 'node:stream';

import type { Logger } from '@ezreeport/logger';
import type {
  JSONMessageTransport,
  JSONMessageTransportQueue,
  rabbitmq,
} from '@ezreeport/rabbitmq';

import {
  BaseRPCClient,
  type ResponseQueue,
  type OnMessageFnc,
} from '../BaseClient';

import { setIdleTimeout } from '../timeout';
import {
  type RPCStreamRequestType,
  RPCStreamResponse,
  type RPCStreamResponseType,
} from './types';
import { readStreamFromQueue, writeStreamIntoQueue } from './queue-streams';

export class RPCStreamClient extends BaseRPCClient {
  protected transport: Promise<JSONMessageTransport<JSONMessageTransportQueue>>;

  constructor(
    channel: rabbitmq.Channel,
    queueName: string,
    appLogger: Logger,
    private opts?: { compression?: boolean }
  ) {
    super(channel, queueName, appLogger);

    this.logger = appLogger.child({
      scope: 'rpc-stream.client',
      queue: queueName,
    });

    this.transport = this.assertTransport();
  }

  protected assertTransport(): Promise<
    JSONMessageTransport<JSONMessageTransportQueue>
  > {
    // oxlint-disable-next-line promise/prefer-await-to-then
    return Promise.resolve({
      channel: this.channel,
      queue: { name: this.queueName },
    });
  }

  protected override setupResponseQueue(
    onMessage: OnMessageFnc<RPCStreamResponseType>
  ): Promise<ResponseQueue> {
    return this._setupResponseQueue(onMessage, RPCStreamResponse);
  }

  protected override sendRequest(
    content: RPCStreamRequestType,
    opts: Omit<rabbitmq.Options.Publish, 'contentType'>
  ): Promise<void> {
    return super._sendRequest(content, opts);
  }

  public async requestWriteStream(...params: unknown[]): Promise<Writable> {
    const stream = new PassThrough();

    // Read data from stream and write it to the queue
    const { dataQueue } = await writeStreamIntoQueue(
      this.channel,
      stream,
      this.logger,
      this.opts?.compression !== false
    );

    let replyTo: string | undefined;

    const timeout = setIdleTimeout(async () => {
      if (!replyTo) {
        return;
      }

      stream.emit('error', new Error('RPC Request timed out'));
      await this.channel.deleteQueue(replyTo);
    }, false);

    // Wait and handle response
    const responseQueue = await this.setupResponseQueue(async (msg, _data) => {
      timeout.stop();

      // TODO: handle error ?

      if (replyTo) {
        await this.channel.deleteQueue(replyTo);
      }
      this.channel.ack(msg);
    });

    const { correlationId } = responseQueue;
    replyTo = responseQueue.replyTo;

    this.sendRequest(
      { method: 'createWriteStream', params, dataQueue },
      { correlationId, replyTo, expiration: timeout.duration }
    );

    timeout.start();

    return stream;
  }

  public async requestReadStream(...params: unknown[]): Promise<Readable> {
    const stream = new PassThrough();
    let replyTo: string | undefined;

    const timeout = setIdleTimeout(async () => {
      if (!replyTo) {
        return;
      }

      stream.emit('error', new Error('RPC Request timed out'));
      await this.channel.deleteQueue(replyTo);
    }, false);

    // Wait and handle response
    const responseQueue = await this.setupResponseQueue(async (msg, data) => {
      timeout.stop();

      if (data.error) {
        stream.emit('error', new Error(data.error));
      }

      if (data.result) {
        // Read data from stream and write it to the queue
        await readStreamFromQueue(
          this.channel,
          msg.properties.replyTo,
          stream,
          this.logger,
          this.opts?.compression !== false
        );
      }

      if (replyTo) {
        await this.channel.deleteQueue(replyTo);
      }
      this.channel.ack(msg);
    });

    const { correlationId } = responseQueue;
    replyTo = responseQueue.replyTo;

    this.sendRequest(
      { method: 'createReadStream', params },
      { correlationId, replyTo, expiration: timeout.duration }
    );

    timeout.start();

    return stream;
  }
}
