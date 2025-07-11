import { Cron, type CronType } from '@ezreeport/models/crons';
import { RPCClient } from '@ezreeport/rpc/client';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

let client: RPCClient | undefined;

export function initCronsClient(channel: rabbitmq.Channel): void {
  // schedulerClient will be called while begin unaware of
  // rabbitmq connection, so we need to store the channel
  // here
  client = new RPCClient(channel, 'ezreeport.rpc:crons', appLogger);
}

export async function getAllCrons(): Promise<CronType[]> {
  if (!client) {
    throw new Error('Cron client not initialized');
  }

  const data = await client.callAll('getAllCrons');
  const crons = new Map<string, CronType>(
    data
      .flat()
      .filter((res): res is CronType => Cron.safeParse(res).success)
      .map((cron) => [cron.name, cron])
  );

  return Array.from(crons.values()).sort((cronA, cronB) =>
    cronA.name.localeCompare(cronB.name)
  );
}

export async function stopCron(cron: string): Promise<CronType> {
  if (!client) {
    throw new Error('Cron client not initialized');
  }

  const data = await client.callAll('stopCron', cron);
  const crons = new Map<string, CronType>(
    data
      .flat()
      .filter((res): res is CronType => Cron.safeParse(res).success)
      .map((cron) => [cron.name, cron])
  );

  const res = crons.get(cron);
  if (!res) {
    throw new Error(`Cron ${cron} not found`);
  }
  return res;
}

export async function startCron(cron: string): Promise<CronType> {
  if (!client) {
    throw new Error('Cron client not initialized');
  }

  const data = await client.callAll('startCron', cron);
  const crons = new Map<string, CronType>(
    data
      .flat()
      .filter((res): res is CronType => Cron.safeParse(res).success)
      .map((cron) => [cron.name, cron])
  );

  const res = crons.get(cron);
  if (!res) {
    throw new Error(`Cron ${cron} not found`);
  }
  return res;
}

export async function forceCron(cron: string): Promise<CronType> {
  if (!client) {
    throw new Error('Cron client not initialized');
  }

  const data = await client.callAll('forceCron', cron);
  const crons = new Map<string, CronType>(
    data
      .flat()
      .filter((res): res is CronType => Cron.safeParse(res).success)
      .map((cron) => [cron.name, cron])
  );

  const res = crons.get(cron);
  if (!res) {
    throw new Error(`Cron ${cron} not found`);
  }
  return res;
}
