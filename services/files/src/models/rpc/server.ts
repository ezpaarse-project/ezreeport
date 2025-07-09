import { setupRPCServer, type RPCServerRouter } from '@ezreeport/rpc/server';
import { setupRPCStreamServer, type RPCStreamRouter } from '@ezreeport/rpc/streams/server';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import { getAllReports, createReadReportStream, createWriteReportStream } from '~/models/reports';
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

const filesRouter: RPCServerRouter = {
  getAllReports,
};

const cronRouter: RPCServerRouter = {
  getAllCrons,
  stopCron,
  startCron,
  forceCron,
};

export default async function initRPCServer(channel: rabbitmq.Channel) {
  const start = process.uptime();

  await setupRPCServer(channel, 'ezreeport.rpc:crons', cronRouter, appLogger);
  await setupRPCServer(channel, 'ezreeport.rpc:files', filesRouter, appLogger);
  await setupRPCStreamServer(channel, 'ezreeport.rpc:files:stream', streamRouter, appLogger);

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
