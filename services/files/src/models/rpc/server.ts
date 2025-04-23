import { setupRPCServer, type RPCServerRouter } from '@ezreeport/rpc/server';
import { setupRPCStreamServer, type RPCStreamRouter } from '@ezreeport/rpc/streams/server';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import { createReadReportStream, createWriteReportStream } from '~/models/reports';
import {
  getAllCrons,
  stopCron,
  startCron,
  forceCron,
} from '~/models/crons';

const logger = appLogger.child({ scope: 'rpc.server' });

const buckets: Record<string, RPCStreamRouter> = {
  reports: {
    createWriteStream: createWriteReportStream,
    createReadStream: createReadReportStream,
  },
};

const streamRouter: RPCStreamRouter = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createWriteStream: (bucketName: string, filename: string, ...params: any[]) => {
    const bucket = buckets[bucketName];
    if (!bucket) {
      throw new Error(`Bucket ${bucketName} not found`);
    }
    if (!bucket.createWriteStream) {
      throw new Error('Method not found for bucket');
    }

    return bucket.createWriteStream(filename, ...params);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createReadStream: (bucketName: string, filename: string, ...params: any[]) => {
    const bucket = buckets[bucketName];
    if (!bucket) {
      throw new Error(`Bucket ${bucketName} not found`);
    }
    if (!bucket.createReadStream) {
      throw new Error('Method not found for bucket');
    }

    return bucket.createReadStream(filename, ...params);
  },
};

const router: RPCServerRouter = {
  getAllCrons,
  stopCron,
  startCron,
  forceCron,
};

export default async function initRPCServer(channel: rabbitmq.Channel) {
  const start = process.uptime();

  await setupRPCStreamServer(channel, 'ezreeport.rpc:files:stream', streamRouter, appLogger, { compression: false });
  await setupRPCServer(channel, 'ezreeport.rpc:crons', router, appLogger);

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
