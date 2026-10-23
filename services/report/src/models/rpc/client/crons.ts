import { Cron, type CronType } from '@ezreeport/models/crons';
import { RPCClient } from '@ezreeport/rpc/client';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

let client: RPCClient | undefined;

export function initCronsClient(channel: rabbitmq.Channel): void {
  // SchedulerClient will be called while begin unaware of
  // Rabbitmq connection, so we need to store the channel
  // Here
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

  return [...crons.values()].toSorted((cronA, cronB) =>
    cronA.name.localeCompare(cronB.name)
  );
}

export async function stopCron(cronName: string): Promise<CronType> {
  if (!client) {
    throw new Error('Cron client not initialized');
  }

  const data = await client.callAll('stopCron', cronName);
  const crons = new Map<string, CronType>(
    data
      .flat()
      .filter((res): res is CronType => Cron.safeParse(res).success)
      .map((cron) => [cron.name, cron])
  );

  const res = crons.get(cronName);
  if (!res) {
    throw new Error(`Cron ${cronName} not found`);
  }
  return res;
}

export async function startCron(cronName: string): Promise<CronType> {
  if (!client) {
    throw new Error('Cron client not initialized');
  }

  const data = await client.callAll('startCron', cronName);
  const crons = new Map<string, CronType>(
    data
      .flat()
      .filter((res): res is CronType => Cron.safeParse(res).success)
      .map((cron) => [cron.name, cron])
  );

  const res = crons.get(cronName);
  if (!res) {
    throw new Error(`Cron ${cronName} not found`);
  }
  return res;
}

export async function forceCron(cronName: string): Promise<CronType> {
  if (!client) {
    throw new Error('Cron client not initialized');
  }

  const data = await client.callAll('forceCron', cronName);
  const crons = new Map<string, CronType>(
    data
      .flat()
      .filter((res): res is CronType => Cron.safeParse(res).success)
      .map((cron) => [cron.name, cron])
  );

  const res = crons.get(cronName);
  if (!res) {
    throw new Error(`Cron ${cronName} not found`);
  }
  return res;
}
