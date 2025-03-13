import { z } from '~common/lib/zod';
import { appLogger } from '~/lib/logger';
import { setupRPCClient, type RPCClient } from '~common/lib/rpc';

import { Cron, CronType } from '~common/types/crons';

import getChannel from '../channel';

let schedulerClient: RPCClient | undefined;

export async function getSchedulerClient() {
  if (!schedulerClient) {
    const channel = await getChannel();
    schedulerClient = setupRPCClient(channel, 'ezreeport.rpc:scheduler', appLogger);
  }
  return schedulerClient;
}

export async function getAllCrons(): Promise<CronType[]> {
  const client = await getSchedulerClient();
  const data = await client.call('getAllCrons');
  return z.array(Cron).parse(data);
}

export async function stopCron(cron: string) {
  const client = await getSchedulerClient();
  const data = await client.call('stopCron', cron);
  return Cron.parse(data);
}

export async function startCron(cron: string) {
  const client = await getSchedulerClient();
  const data = await client.call('startCron', cron);
  return Cron.parse(data);
}

export async function forceCron(cron: string) {
  const client = await getSchedulerClient();
  const data = await client.call('forceCron', cron);
  return Cron.parse(data);
}
