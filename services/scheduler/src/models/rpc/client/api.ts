import { z } from '~common/lib/zod';
import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';
import { setupRPCClient, type RPCClient } from '~common/lib/rpc';

import { Task, type TaskType } from '~common/types/tasks';
import { Template, type TemplateType } from '~common/types/templates';
import { Namespace, type NamespaceType } from '~common/types/namespaces';

let client: RPCClient | undefined;

export async function initAPIClient(channel: rabbitmq.Channel) {
  // apiClient will be called while begin unaware of
  // rabbitmq connection, so we need to store the channel
  // here
  client = setupRPCClient(channel, 'ezreeport.rpc:api', appLogger);
}

const allPagination = { count: 0, order: 'asc', page: 1 };

export async function getAllTasks(filters?: Record<string, unknown>): Promise<TaskType[]> {
  if (!client) {
    throw new Error('API client not initialized');
  }

  const data = await client.call('getAllTasks', filters, undefined, allPagination);
  return z.array(Task).parse(data);
}

export async function getAllTemplates(): Promise<TemplateType[]> {
  if (!client) {
    throw new Error('API client not initialized');
  }

  const data = await client.call('getAllTemplates', undefined, allPagination);
  return z.array(Template).parse(data);
}

export async function getAllNamespaces(): Promise<NamespaceType[]> {
  if (!client) {
    throw new Error('API client not initialized');
  }

  const data = await client.call('getAllNamespaces', undefined, allPagination);
  return z.array(Namespace).parse(data);
}
