import { randomUUID } from 'node:crypto';

import type { z } from '@ezreeport/models/lib/zod';
import type { Logger } from '@ezreeport/logger';
import {
  type rabbitmq,
  type JSONMessageTransport,
  type JSONMessageTransportExchange,
  type JSONMessageTransportQueue,
  parseJSONMessage,
  sendJSONMessage,
} from '@ezreeport/rabbitmq';

import type { RPCRequestType, RPCResponseType } from './types';

export type OnMessageFnc<ResponseType extends RPCResponseType> = (
  msg: rabbitmq.ConsumeMessage,
  data: ResponseType
) => Promise<void> | void;

export type ResponseQueue = {
  correlationId: string;
  replyTo: string;
};

type AnyJSONMessageTransport = JSONMessageTransport<
  JSONMessageTransportQueue | JSONMessageTransportExchange
>;

export abstract class BaseRPCClient {
  protected logger: Logger;
  protected abstract transport: Promise<AnyJSONMessageTransport>;

  constructor(
    protected channel: rabbitmq.Channel,
    protected queueName: string,
    appLogger: Logger
  ) {
    this.logger = appLogger.child({ scope: 'rpc.client', queue: queueName });
  }

  protected async _setupResponseQueue<ResponseType extends RPCResponseType>(
    onMessage: OnMessageFnc<ResponseType>,
    ResponseValidation: z.ZodSchema<ResponseType>
  ): Promise<ResponseQueue> {
    const correlationId = randomUUID();
    const { queue: responseQueue } = await this.channel.assertQueue('', {
      exclusive: true,
      durable: false,
    });

    await this.channel.consume(responseQueue, async (msg) => {
      if (!msg) {
        return;
      }
      if (msg.properties.correlationId !== correlationId) {
        this.channel.nack(msg);
        return;
      }

      // Parse message
      const { data, raw, parseError } = parseJSONMessage(
        msg,
        ResponseValidation
      );
      if (!data) {
        this.logger.error({
          msg: 'Invalid data',
          data: process.env.NODE_ENV === 'production' ? undefined : raw,
          err: parseError,
        });
        this.channel.nack(msg, undefined, false);
        return;
      }

      await onMessage(msg, data);
    });

    return { correlationId, replyTo: responseQueue };
  }

  protected abstract setupResponseQueue(
    onMessage: OnMessageFnc<RPCResponseType>
  ): Promise<ResponseQueue>;

  protected async _sendRequest<RequestType extends RPCRequestType>(
    content: RequestType,
    opts: Omit<rabbitmq.Options.Publish, 'contentType'>
  ): Promise<void> {
    const { size } = sendJSONMessage<RequestType>(
      await this.transport,
      content,
      opts
    );
    this.logger.debug({
      msg: 'Request sent',
      method: content.method,
      params: content.params,
      size,
      sizeUnit: 'B',
    });
  }

  protected abstract sendRequest(
    content: RPCRequestType,
    opts: Omit<rabbitmq.Options.Publish, 'contentType'>
  ): Promise<void>;
}
