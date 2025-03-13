import { z } from '~common/lib/zod';
import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';
import { setupRPCClient, type RPCClient } from '~common/lib/rpc';

import { Cron, CronType } from '~common/types/crons';

let client: RPCClient | undefined;

export async function initSchedulerClient(channel: rabbitmq.Channel) {
  // schedulerClient will be called while begin unaware of
  // rabbitmq connection, so we need to store the channel
  // here
  client = setupRPCClient(channel, 'ezreeport.rpc:scheduler', appLogger);
}

export async function getAllCrons(): Promise<CronType[]> {
  if (!client) {
    throw new Error('Scheduler client not initialized');
  }

  const data = await client.call('getAllCrons');
  return z.array(Cron).parse(data);
}

export async function stopCron(cron: string) {
  if (!client) {
    throw new Error('Scheduler client not initialized');
  }

  const data = await client.call('stopCron', cron);
  return Cron.parse(data);
}

export async function startCron(cron: string) {
  if (!client) {
    throw new Error('Scheduler client not initialized');
  }

  const data = await client.call('startCron', cron);
  return Cron.parse(data);
}

export async function forceCron(cron: string) {
  if (!client) {
    throw new Error('Scheduler client not initialized');
  }

  const data = await client.call('forceCron', cron);
  return Cron.parse(data);
}
