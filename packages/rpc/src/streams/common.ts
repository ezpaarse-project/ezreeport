import type { Readable, Writable } from 'node:stream';
import { createGzip, createUnzip } from 'node:zlib';

import { parseJSONMessage, sendJSONToQueue, type rabbitmq } from '@ezreeport/rabbitmq';

import type { Logger } from '@ezreeport/logger';

import { RPCStreamChunk, type RPCStreamChunkType } from './types';

export async function writeStreamIntoQueue(
  channel: rabbitmq.Channel,
  inputStream: Readable,
  logger: Logger,
  compression = false,
) {
  let stream = inputStream;
  if (compression) {
    stream = inputStream.pipe(createGzip());
  }

  const { queue: dataQueue } = await channel.assertQueue('', {
    durable: false,
  });

  stream.on('data', (chunk) => {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);

    const { size } = sendJSONToQueue<RPCStreamChunkType>(channel, dataQueue, {
      chunk: { type: 'Buffer', data: Array.from(buf) }, // JSON represents Buffer
      ended: false,
    });

    logger.trace({
      msg: 'Sending chunk',
      size,
      sizeUnit: 'B',
    });
  });

  stream.on('error', (err) => {
    const { size } = sendJSONToQueue<RPCStreamChunkType>(channel, dataQueue, {
      error: err instanceof Error ? err.message : `${err}`,
      ended: true,
    });

    logger.error({
      msg: 'Error while sending chunk',
      size,
      sizeUnit: 'B',
      err,
    });
  });

  stream.on('end', () => {
    const { size } = sendJSONToQueue<RPCStreamChunkType>(channel, dataQueue, {
      ended: true,
    });

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
  compression = false,
) {
  let stream = outputStream;
  if (compression) {
    stream = createUnzip().pipe(outputStream);
  }

  await channel.consume(dataQueue, (msg) => {
    if (!msg) {
      return;
    }

    // Parse message
    const { data, raw, parseError } = parseJSONMessage(msg, RPCStreamChunk);
    if (!data) {
      logger.error({
        msg: 'Invalid data',
        data: process.env.NODE_ENV === 'production' ? undefined : raw,
        err: parseError,
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
