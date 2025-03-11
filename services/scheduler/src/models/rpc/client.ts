import { randomUUID } from 'node:crypto';

import { z } from '~common/lib/zod';
import { appLogger } from '~/lib/logger';
import rabbitmq, { getConnection } from '~/lib/rabbitmq';

import { RPCResponse } from '~common/types/queues';
import { Task, type TaskType } from '~common/types/tasks';
import { Template, type TemplateType } from '~common/types/templates';
import { Namespace, type NamespaceType } from '~common/types/namespaces';

const logger = appLogger.child({ scope: 'rpc.client' });

const rpcQueue = 'ezreeport.rpc:api';

let channel: rabbitmq.Channel | undefined;

async function callRemoteProcedure(method: string, ...params: unknown[]): Promise<unknown> {
  if (!channel) {
    throw new Error('rpc is not initialized');
  }

  const responseQueue = await channel.assertQueue('', { exclusive: true });
  const correlationId = randomUUID();

  const promise = new Promise<unknown>((resolve, reject) => {
    channel!.consume(
      responseQueue.queue,
      (msg) => {
        if (!msg || msg.properties.correlationId !== correlationId) {
          return;
        }

        // Parse message
        const raw = JSON.parse(msg.content.toString());
        let data;
        try {
          data = RPCResponse.parse(raw);
        } catch (error) {
          logger.error({
            msg: 'Invalid data',
            data: process.env.NODE_ENV === 'production' ? undefined : raw,
            error,
          });
          return;
        }

        if (data.result) {
          resolve(data.result);
          return;
        }

        reject(new Error(data.error || 'Unknown error'));
      },
    );

    setTimeout(() => {
      reject(new Error("Timeout, couldn't get response from RPC server"));
    }, 15000);
  });

  channel.sendToQueue(
    rpcQueue,
    Buffer.from(JSON.stringify({ method, params })),
    { correlationId, replyTo: responseQueue.queue },
  );

  return promise;
}

export async function getAllTasks(filters?: Record<string, unknown>): Promise<TaskType[]> {
  const data = await callRemoteProcedure('getAllTasks', filters);
  return z.array(Task).parse(data);
}

export async function getAllTemplates(): Promise<TemplateType[]> {
  const data = await callRemoteProcedure('getAllTemplates');
  return z.array(Template).parse(data);
}

export async function getAllNamespaces(): Promise<NamespaceType[]> {
  const data = await callRemoteProcedure('getAllNamespaces');
  return z.array(Namespace).parse(data);
}

export async function initRPCClient() {
  const start = process.uptime();

  const connection = await getConnection();

  channel = await connection.createChannel();
  logger.debug('Channel created');

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
