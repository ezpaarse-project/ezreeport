import { z } from '~common/lib/zod';
import { appLogger } from '~/lib/logger';
import { setupRPCClient, type RPCClient } from '~common/lib/rpc';

import { Task, type TaskType } from '~common/types/tasks';
import { Template, type TemplateType } from '~common/types/templates';
import { Namespace, type NamespaceType } from '~common/types/namespaces';

import getChannel from '../channel';

let apiClient: RPCClient | undefined;

export async function getAPIClient() {
  if (!apiClient) {
    const channel = await getChannel();
    apiClient = setupRPCClient(channel, 'ezreeport.rpc:api', appLogger);
  }
  return apiClient;
}

export async function getAllTasks(filters?: Record<string, unknown>): Promise<TaskType[]> {
  const client = await getAPIClient();
  const data = await client.call('getAllTasks', filters);
  return z.array(Task).parse(data);
}

export async function getAllTemplates(): Promise<TemplateType[]> {
  const client = await getAPIClient();
  const data = await client.call('getAllTemplates');
  return z.array(Template).parse(data);
}

export async function getAllNamespaces(): Promise<NamespaceType[]> {
  const client = await getAPIClient();
  const data = await client.call('getAllNamespaces');
  return z.array(Namespace).parse(data);
}
