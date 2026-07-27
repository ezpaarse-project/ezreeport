import type { Readable, Writable } from 'node:stream';
import { createGunzip, createGzip } from 'node:zlib';

import type { Logger } from '@ezreeport/logger';
import {
  parseJSONMessage,
  type rabbitmq,
  sendJSONMessage,
} from '@ezreeport/rabbitmq';

import { RPCStreamChunk, type RPCStreamChunkType } from './types';

export async function writeStreamIntoQueue(
  channel: rabbitmq.Channel,
  inputStream: Readable,
  logger: Logger,
  compression = false
) {
  let stream = inputStream;
  if (compression) {
    const gzip = createGzip();
    inputStream.pipe(gzip);
    stream = gzip;
  }

  const { queue: dataQueue } = await channel.assertQueue('', {
    durable: true,
  });

  stream.on('data', (chunk) => {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);

    const { size } = sendJSONMessage<RPCStreamChunkType>(
      { channel, queue: { name: dataQueue } },
      // JSON represents Buffer
      { chunk: { data: [...buf], type: 'Buffer' }, ended: false }
    );

    logger.trace({
      msg: 'Sending chunk',
      size,
      sizeUnit: 'B',
    });
  });

  stream.on('error', (err) => {
    const { size } = sendJSONMessage<RPCStreamChunkType>(
      { channel, queue: { name: dataQueue } },
      { ended: true, error: err instanceof Error ? err.message : `${err}` }
    );

    logger.error({
      err,
      msg: 'Error while sending chunk',
      size,
      sizeUnit: 'B',
    });
  });

  stream.on('end', () => {
    const { size } = sendJSONMessage<RPCStreamChunkType>(
      { channel, queue: { name: dataQueue } },
      { ended: true }
    );

    logger.trace({
      msg: 'Sending end chunk',
      size,
      sizeUnit: 'B',
    });
  });

  return {
    dataQueue,
  };
}

export async function readStreamFromQueue(
  channel: rabbitmq.Channel,
  dataQueue: string,
  outputStream: Writable,
  logger: Logger,
  compression = false
) {
  let stream = outputStream;
  if (compression) {
    const gzip = createGunzip();
    gzip.pipe(outputStream);
    stream = gzip;
  }

  await channel.consume(dataQueue, (msg) => {
    if (!msg) {
      return;
    }

    // Parse message
    const { data, raw, parseError } = parseJSONMessage(msg, RPCStreamChunk);
    if (!data) {
      logger.error({
        data: process.env.NODE_ENV === 'production' ? undefined : raw,
        err: parseError,
        msg: 'Invalid data',
      });
      channel.nack(msg, undefined, false);
      return;
    }

    if (data.error) {
      stream.emit('error', new Error(data.error));
      channel.ack(msg);
      return;
    }

    if (data.ended) {
      stream.end();
      channel.ack(msg);
      return;
    }

    if (data.chunk) {
      stream.write(Buffer.from(data.chunk.data));
      channel.ack(msg);
      return;
    }

    channel.nack(msg);
  });

  // Wait for the stream to be closed
  stream.on('close', async () => {
    await channel.deleteQueue(dataQueue);
  });
}
