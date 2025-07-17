import { parseISO } from 'date-fns';

import { client } from '~/lib/fetch';
import type { ApiResponse } from '~/lib/api';

import { assignPermission } from '~/helpers/permissions/decorator';

import type { RawCron, Cron, InputCron } from './types';

const transformCron = (cron: RawCron): Cron => ({
  ...cron,
  lastRun: cron.lastRun ? parseISO(cron.lastRun) : undefined,
  nextRun: cron.nextRun ? parseISO(cron.nextRun) : undefined,
});

export async function getAllCrons(): Promise<Cron[]> {
  const {
    content,
  } = await client.fetch<ApiResponse<RawCron[]>>('/crons');

  return content.map(transformCron);
}
assignPermission(getAllCrons, 'GET /crons');

export async function getCron(
  cronOrName: Cron | string,
): Promise<Cron> {
  const name = typeof cronOrName === 'string' ? cronOrName : cronOrName.name;

  const {
    content,
  } = await client.fetch<ApiResponse<RawCron>>(`/crons/${name}`);

  return transformCron(content);
}
assignPermission(getCron, 'GET /crons/:name');

export async function updateCron(
  cron: InputCron & { name: string },
): Promise<Cron> {
  const { name, ...data } = cron;

  const {
    content,
  } = await client.fetch<ApiResponse<RawCron>>(`/crons/${name}`, {
    method: 'PATCH',
    body: data,
  });

  return transformCron(content);
}
assignPermission(updateCron, 'PATCH /crons/:name');

export async function forceCron(
  cronOrName: Cron | string,
): Promise<Cron> {
  const name = typeof cronOrName === 'string' ? cronOrName : cronOrName.name;

  const {
    content,
  } = await client.fetch<ApiResponse<RawCron>>(`/crons/${name}`, {
    method: 'POST',
  });

  return transformCron(content);
}
assignPermission(forceCron, 'POST /crons/:name');
