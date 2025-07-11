import { hostname } from 'node:os';
import { statfs } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';

import { type rabbitmq, sendJSONMessage } from '@ezreeport/rabbitmq';
import type { Logger } from '@ezreeport/logger';

import type {
  FileSystemUsageType,
  HeartbeatType,
  HeartbeatService,
} from '../types';
import { HeartBeatManager } from './Manager';

export class HeartBeatSender extends HeartBeatManager {
  private _watchingFileSystems: [string, string][] = [];

  public get watchingFileSystems(): Record<string, string> {
    return Object.fromEntries(this._watchingFileSystems);
  }

  private interval: NodeJS.Timeout;

  constructor(
    channel: rabbitmq.Channel,
    appLogger: Logger,
    private service: HeartbeatService,
    mandatoryServices?: Map<string, boolean>,
    private frequency = 1000
  ) {
    super(channel, appLogger, mandatoryServices);

    this.interval = setInterval(this.send, this.frequency);

    // If connection to rabbitmq is lost, stop regular heartbeats (and note rabbitmq as down)
    this.channel.on('close', () => {
      clearInterval(this.interval);
      if (this.mandatoryServices) {
        this.mandatoryServices.set('rabbitmq', false);
      }
    });
  }

  private getFilesystemStatus(): Promise<FileSystemUsageType[]> {
    // oxlint-disable-next-line prefer-await-to-then
    return Promise.all(
      this._watchingFileSystems.map(async ([name, path]) => {
        const stats = await statfs(path);

        const total = stats.bsize * stats.blocks;
        const available = stats.bavail * stats.bsize;

        return {
          name,
          total,
          available,
          used: total - available,
        };
      })
    );
  }

  private async sendHeartbeat(data: HeartbeatType): Promise<void> {
    try {
      const { size } = sendJSONMessage(await this.transport, data);
      this.logger.trace({
        msg: 'Heartbeat sent',
        service: data.service,
        size,
        sizeUnit: 'B',
      });
    } catch (err) {
      this.logger.error({
        msg: 'Failed to send heartbeat',
        service: this.service.name,
        err,
      });
    }
  }

  private async sendMainHeartbeat(): Promise<void> {
    const filesystems = await this.getFilesystemStatus();

    return this.sendHeartbeat({
      service: this.service.name,
      hostname: hostname(),
      version: this.service.version,
      filesystems: filesystems.length > 0 ? filesystems : undefined,
      updatedAt: new Date(),
    });
  }

  private async sendConnectedHeartbeats(): Promise<void> {
    if (!this.service.getConnectedServices) {
      return;
    }

    const pings = this.service.getConnectedServices();
    await Promise.allSettled(
      // Send heartbeat on ping result
      pings.map((promise) =>
        // oxlint-disable-next-line catch-or-return
        Promise.race([
          promise
            .then((beat) => this.sendHeartbeat(beat))
            .catch((err) =>
              this.logger.error({
                msg: 'Error when getting connected service',
                err,
              })
            ),
          // Wait for frequency/2
          setTimeout(this.frequency / 2),
        ])
      )
    );
  }

  public send(): void {
    this.sendMainHeartbeat();
    this.sendConnectedHeartbeats();
  }
}
