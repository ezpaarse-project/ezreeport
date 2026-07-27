import type { Logger } from '@ezreeport/logger';
import { parseJSONMessage, type rabbitmq } from '@ezreeport/rabbitmq';

import { Heartbeat, type HeartbeatType } from '../types';
import { HeartbeatManager } from './Manager';

export class HeartbeatListener extends HeartbeatManager {
  constructor(
    channel: rabbitmq.Channel,
    private onHeartbeat: (beat: HeartbeatType) => Promise<void> | void,
    appLogger: Logger
  ) {
    super(channel, appLogger);

    this.listenToHearbeats();
  }

  private async onMessage(msg: rabbitmq.ConsumeMessage | null): Promise<void> {
    if (!msg) {
      return;
    }

    // Parse message
    const { data, raw, parseError } = parseJSONMessage(msg, Heartbeat);
    if (!data) {
      this.logger.error({
        data: process.env.NODE_ENV === 'production' ? undefined : raw,
        err: parseError,
        msg: 'Invalid data',
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
