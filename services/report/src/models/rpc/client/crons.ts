import { Cron, type CronType } from '@ezreeport/models/crons';
import { setupRPCClient, type RPCClient } from '@ezreeport/rpc/client';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

let client: RPCClient | undefined;

export async function initCronsClient(channel: rabbitmq.Channel) {
  // schedulerClient will be called while begin unaware of
  // rabbitmq connection, so we need to store the channel
  // here
  client = setupRPCClient(channel, 'ezreeport.rpc:crons', appLogger);
}

export async function getAllCrons(): Promise<CronType[]> {
  if (!client) {
    throw new Error('Cron client not initialized');
  }

  const data = await client.callAll('getAllCrons');
  const crons = new Map<string, CronType>(
    data.flat()
      .filter((res): res is CronType => Cron.safeParse(res).success)
      .map((c) => [c.name, c]),
  );

  return Array.from(crons.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function stopCron(cron: string) {
  if (!client) {
    throw new Error('Cron client not initialized');
  }

  const data = await client.callAll('stopCron', cron);
  const crons = new Map<string, CronType>(
    data.flat()
      .filter((res): res is CronType => Cron.safeParse(res).success)
      .map((c) => [c.name, c]),
  );

  const res = crons.get(cron);
  if (!res) {
    throw new Error(`Cron ${cron} not found`);
  }
  return res;
}

export async function startCron(cron: string) {
  if (!client) {
    throw new Error('Cron client not initialized');
  }

  const data = await client.callAll('startCron', cron);
  const crons = new Map<string, CronType>(
    data.flat()
      .filter((res): res is CronType => Cron.safeParse(res).success)
      .map((c) => [c.name, c]),
  );

  const res = crons.get(cron);
  if (!res) {
    throw new Error(`Cron ${cron} not found`);
  }
  return res;
}

export async function forceCron(cron: string) {
  if (!client) {
    throw new Error('Cron client not initialized');
  }

  const data = await client.callAll('forceCron', cron);
  const crons = new Map<string, CronType>(
    data.flat()
      .filter((res): res is CronType => Cron.safeParse(res).success)
      .map((c) => [c.name, c]),
  );

  const res = crons.get(cron);
  if (!res) {
    throw new Error(`Cron ${cron} not found`);
  }
  return res;
}
