import { hostname } from 'node:os';
import { setTimeout } from 'node:timers/promises';

import type rabbitmq from 'amqplib';
import type { Logger } from 'pino';

import { z } from './zod';

export const Heartbeat = z.object({
  service: z.string().min(1)
    .describe('Service sending the heartbeat'),

  hostname: z.string().min(1)
    .describe('Hostname of the service'),

  version: z.string().min(1).optional()
    .describe('Version of the service'),

  updatedAt: z.coerce.date()
    .describe('Creation date of heartbeat'),
});

export type HeartbeatType = z.infer<typeof Heartbeat>;

type Pinger = () => Promise<HeartbeatType>;

export type HeartbeatService = {
  name: string,
  version: string,
  getConnectedServices?: () => Promise<HeartbeatType>[],
};

export async function setupHeartbeat(
  channel: rabbitmq.Channel,
  service: HeartbeatService,
  appLogger: Logger,
  frequency = 10000,
) {
  const logger = appLogger.child({ scope: 'heartbeat' });

  const { exchange } = await channel.assertExchange('ezreeport.heartbeat', 'fanout', { durable: false });
  logger.debug({
    msg: 'Heartbeat queue created',
    exchange,
  });

  const sendHeartbeat = (data: HeartbeatType) => {
    try {
      const buf = Buffer.from(JSON.stringify(data));
      channel.publish(exchange, '', buf);
      logger.trace({
        msg: 'Heartbeat sent',
        service: data.service,
        size: buf.byteLength,
        sizeUnit: 'B',
      });
    } catch (err) {
      logger.error({
        msg: 'Failed to send heartbeat',
        service: service.name,
        err,
      });
    }
  };

  const sendMainHeartbeat = () => sendHeartbeat({
    service: service.name,
    hostname: hostname(),
    version: service.version,
    updatedAt: new Date(),
  });

  const sendConnectedHeartbeats = async () => {
    if (!service.getConnectedServices) {
      return;
    }

    const pings = service.getConnectedServices();
    await Promise.allSettled(
      pings.map((promise) => Promise.race([
        promise
          .then((beat) => sendHeartbeat(beat))
          .catch((err) => logger.error({
            msg: 'Error when getting connected service',
            err,
          })),
        setTimeout(frequency / 2),
      ])),
    );
  };

  const send = () => {
    sendMainHeartbeat();
    sendConnectedHeartbeats();
  };

  const interval = setInterval(send, frequency);
  channel.on('close', () => { clearInterval(interval); });

  return { send };
}

export async function listenToHeartbeats(
  channel: rabbitmq.Channel,
  appLogger: Logger,
  onHeartbeat: (beat: HeartbeatType) => Promise<void> | void,
) {
  const logger = appLogger.child({ scope: 'heartbeat' });

  const { exchange } = await channel.assertExchange('ezreeport.heartbeat', 'fanout', { durable: false });
  logger.debug({
    msg: 'Heartbeat queue created',
    exchange,
  });

  const onMessage = async (msg: rabbitmq.ConsumeMessage | null) => {
    if (!msg) {
      return;
    }

    // Parse message
    const raw = JSON.parse(msg.content.toString());
    let data;
    try {
      data = Heartbeat.parse(raw);
    } catch (error) {
      logger.error({
        msg: 'Invalid data',
        data: process.env.NODE_ENV === 'production' ? undefined : raw,
        error,
      });
      return;
    }

    await onHeartbeat(data);
  };

  const { queue } = await channel.assertQueue('', { exclusive: true });
  channel.bindQueue(queue, exchange, '');
  channel.consume(queue, (msg) => onMessage(msg), { noAck: true });
}

const mandatoryServices = new Map<string, boolean>();

export async function mandatoryService(name: string, pinger: Pinger): Promise<HeartbeatType> {
  try {
    const beat = await pinger();
    mandatoryServices.set(name, true);
    return beat;
  } catch (error) {
    mandatoryServices.set(name, false);
    throw error;
  }
}

export function getMissingMandatoryServices() {
  return Array.from(mandatoryServices.entries())
    .filter(([, value]) => !value)
    .map(([key]) => key);
}
