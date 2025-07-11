import { type rabbitmq, parseJSONMessage } from '@ezreeport/rabbitmq';
import type { Logger } from '@ezreeport/logger';

import { type HeartbeatType, Heartbeat } from '../types';
import { HeartBeatManager } from './Manager';

export class HeartBeatListener extends HeartBeatManager {
  constructor(
    channel: rabbitmq.Channel,
    private onHeartbeat: (beat: HeartbeatType) => Promise<void> | void,
    appLogger: Logger
  ) {
    super(channel, appLogger);
  }

  private async onMessage(msg: rabbitmq.ConsumeMessage | null): Promise<void> {
    if (!msg) {
      return;
    }

    // Parse message
    const { data, raw, parseError } = parseJSONMessage(msg, Heartbeat);
    if (!data) {
      this.logger.error({
        msg: 'Invalid data',
        data: process.env.NODE_ENV === 'production' ? undefined : raw,
        err: parseError,
      });
      return;
    }

    await this.onHeartbeat(data);
  }

  private async listenToHearbeats(): Promise<void> {
    const { exchange } = await this.transport;
    const { queue } = await this.channel.assertQueue('', { exclusive: true });

    await this.channel.bindQueue(queue, exchange.name, exchange.routingKey);
    await this.channel.consume(queue, (msg) => this.onMessage(msg), {
      noAck: true,
    });
  }
}
