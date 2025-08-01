import type { Writable } from 'node:stream';

import { RPCServer, type RPCServerRouter } from '@ezreeport/rpc/server';
import {
  RPCStreamServer,
  type RPCStreamRouter,
} from '@ezreeport/rpc/streams/server';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import {
  getAllReports,
  createReadReportStream,
  createWriteReportStream,
} from '~/models/reports';
import { getAllCrons, stopCron, startCron, forceCron } from '~/models/crons';

const logger = appLogger.child({ scope: 'rpc.server' });

const buckets: Record<string, RPCStreamRouter> = {
  reports: {
    createWriteStream: createWriteReportStream,
    createReadStream: createReadReportStream,
  },
};

const writeLocks = new Map<string, Promise<unknown>>();

function acquireWriteLock(id: string, stream: Writable) {
  // Keep the promise alive until the file is written
  writeLocks.set(
    id,
    // oxlint-disable-next-line promise/avoid-new
    new Promise<void>((resolve, reject) => {
      stream.on('finish', () => {
        writeLocks.delete(id);
        resolve();
      });
      stream.on('error', reject);
    })
  );
}

const streamRouter: RPCStreamRouter = {
  createWriteStream: async (
    bucketName: string,
    filename: string,
    // oxlint-disable-next-line no-explicit-any
    ...params: any[]
  ) => {
    const bucket = buckets[bucketName];
    if (!bucket) {
      throw new Error(`Bucket ${bucketName} not found`);
    }
    if (!bucket.createWriteStream) {
      throw new Error('Method not found for bucket');
    }

    const stream = await bucket.createWriteStream(filename, ...params);
    acquireWriteLock(`${bucket}:${filename}`, stream);

    return stream;
  },
  createReadStream: async (
    bucketName: string,
    filename: string,
    // oxlint-disable-next-line no-explicit-any
    ...params: any[]
  ) => {
    const bucket = buckets[bucketName];
    if (!bucket) {
      throw new Error(`Bucket ${bucketName} not found`);
    }
    if (!bucket.createReadStream) {
      throw new Error('Method not found for bucket');
    }

    const lock = writeLocks.get(`${bucket}:${filename}`);
    if (lock) {
      await lock;
    }

    return bucket.createReadStream(filename, ...params);
  },
};

const filesRouter: RPCServerRouter = {
  getAllReports,
};

const cronRouter: RPCServerRouter = {
  getAllCrons,
  stopCron,
  startCron,
  forceCron,
};

let _cronServer: RPCServer | undefined;
let _fileServer: RPCServer | undefined;
let _fileStreamServer: RPCStreamServer | undefined;

export default function initRPCServer(channel: rabbitmq.Channel): void {
  const start = process.uptime();

  _cronServer = new RPCServer(
    channel,
    'ezreeport.rpc:crons',
    appLogger,
    cronRouter
  );
  _fileServer = new RPCServer(
    channel,
    'ezreeport.rpc:files',
    appLogger,
    filesRouter
  );
  _fileStreamServer = new RPCStreamServer(
    channel,
    'ezreeport.rpc:files:stream',
    appLogger,
    streamRouter
  );

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
