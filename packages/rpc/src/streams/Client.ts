import { PassThrough, type Readable, type Writable } from 'node:stream';
import { randomUUID } from 'node:crypto';

import type { Logger } from '@ezreeport/logger';
import {
  type rabbitmq,
  type JSONMessageTransport,
  type JSONMessageTransportQueue,
  parseJSONMessage,
  sendJSONMessage,
} from '@ezreeport/rabbitmq';

import { setIdleTimeout } from '../timeout';
import {
  type RPCStreamRequestType,
  RPCStreamResponse,
  type RPCStreamResponseType,
} from './types';
import { readStreamFromQueue, writeStreamIntoQueue } from './queue-streams';

type OnMessageFnc<ResponseType extends RPCStreamResponseType> = (
  msg: rabbitmq.ConsumeMessage,
  data: ResponseType
) => Promise<void> | void;

type ResponseQueue = {
  correlationId: string;
  replyTo: string;
};

type RPCClientTransport = JSONMessageTransport<JSONMessageTransportQueue>;

export class RPCStreamClient {
  private logger: Logger;

  private transport: Promise<RPCClientTransport>;

  constructor(
    channel: rabbitmq.Channel,
    queueName: string,
    appLogger: Logger,
    private opts?: { compression?: boolean }
  ) {
    this.logger = appLogger.child({
      scope: 'rpc-stream.client',
      queue: queueName,
    });

    this.transport = this.assertTransport(channel, queueName);
  }

  private assertTransport(
    channel: rabbitmq.Channel,
    queueName: string
  ): Promise<RPCClientTransport> {
    this.logger.debug('RPC client setup');
    // oxlint-disable-next-line promise/prefer-await-to-then
    return Promise.resolve({
      channel: channel,
      queue: { name: queueName },
    });
  }

  private async setupResponseQueue(
    onMessage: OnMessageFnc<RPCStreamResponseType>
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
      const { data, raw, parseError } = parseJSONMessage(
        msg,
        RPCStreamResponse
      );
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

  public async requestWriteStream(...params: unknown[]): Promise<Writable> {
    const { channel, queue } = await this.transport;
    const stream = new PassThrough();

    // Read data from stream and write it to the queue
    const { dataQueue } = await writeStreamIntoQueue(
      channel,
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
      await channel.deleteQueue(replyTo);
    }, false);

    // Wait and handle response
    const responseQueue = await this.setupResponseQueue(async (msg, _data) => {
      timeout.stop();

      // TODO: handle error ?

      if (replyTo) {
        await channel.deleteQueue(replyTo);
      }
      channel.ack(msg);
    });

    const { correlationId } = responseQueue;
    replyTo = responseQueue.replyTo;

    const { size } = sendJSONMessage<RPCStreamRequestType>(
      { channel, queue },
      { method: 'createWriteStream', params, dataQueue },
      { correlationId, replyTo, expiration: timeout.duration }
    );
    this.logger.debug({
      msg: 'Request sent',
      method: 'createWriteStream',
      params,
      size,
      sizeUnit: 'B',
    });

    timeout.start();

    return stream;
  }

  public async requestReadStream(...params: unknown[]): Promise<Readable> {
    const { channel, queue } = await this.transport;
    const stream = new PassThrough();
    let replyTo: string | undefined;

    const timeout = setIdleTimeout(async () => {
      if (!replyTo) {
        return;
      }

      stream.emit('error', new Error('RPC Request timed out'));
      await channel.deleteQueue(replyTo);
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
          channel,
          msg.properties.replyTo,
          stream,
          this.logger,
          this.opts?.compression !== false
        );
      }

      if (replyTo) {
        await channel.deleteQueue(replyTo);
      }
      channel.ack(msg);
    });

    const { correlationId } = responseQueue;
    replyTo = responseQueue.replyTo;

    const { size } = sendJSONMessage<RPCStreamRequestType>(
      { channel, queue },
      { method: 'createReadStream', params },
      { correlationId, replyTo, expiration: timeout.duration }
    );
    this.logger.debug({
      msg: 'Request sent',
      method: 'createReadStream',
      params,
      size,
      sizeUnit: 'B',
    });

    timeout.start();

    return stream;
  }
}
