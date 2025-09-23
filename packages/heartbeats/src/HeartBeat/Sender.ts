import { hostname } from 'node:os';
import { statfs } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';

import { type rabbitmq, sendJSONMessage } from '@ezreeport/rabbitmq';
import type { Logger } from '@ezreeport/logger';

import type {
  FileSystemUsageType,
  HeartbeatType,
  HeartbeatService,
  HeartbeatFrequency,
  HeartbeatConnectedServicePing,
} from '../types';

import { HeartbeatManager } from './Manager';

export class HeartbeatSender extends HeartbeatManager {
  /** Entries of filesystems needing to be watched */
  private _watchingFileSystems: [string, string][] = [];

  /** Map of watched filesystems */
  public get watchingFileSystems(): Record<string, string> {
    return Object.fromEntries(this._watchingFileSystems);
  }

  /** Entries of services needing to be watched */
  private _watchingServices: [string, HeartbeatConnectedServicePing][] = [];

  /** Config of frequency */
  private frequencyConfig: HeartbeatFrequency = {
    // self: 2 seconds
    self: 2 * 1000,

    connected: {
      // min: 5 seconds
      min: 5 * 1000,
      // max: 5 mins
      max: 5 * 60 * 1000,
    },
  };

  /** Map of frequency by service */
  private frequencyByService = new Map<
    string,
    { last: number; next: number }
  >();

  /** Map of NodeJS timeouts by service, useful when closing */
  private timeoutByService = new Map<string, NodeJS.Timeout>();

  constructor(
    channel: rabbitmq.Channel,
    appLogger: Logger,
    private service: HeartbeatService,
    mandatoryServices?: Map<string, boolean>,
    frequency?: HeartbeatFrequency
  ) {
    super(channel, appLogger, mandatoryServices);

    // Setting custom config
    if (frequency) {
      this.frequencyConfig = frequency;
    }

    // Mapping filesystems
    this._watchingFileSystems = Object.entries(
      service.filesystems ?? {}
    ).filter(([, path]) => path);

    // Mapping connect services
    this._watchingServices = Object.entries(service.connectedServices ?? {});

    this.scheduleNextMainHeartbeat();
    for (const [key, service] of this._watchingServices) {
      this.scheduleConnectedHeartbeat(key, service);
    }

    // If connection to rabbitmq is lost, stop regular heartbeats (and note rabbitmq as down)
    this.channel.on('close', () => {
      for (const [, timeout] of this.timeoutByService) {
        clearTimeout(timeout);
      }

      if (this.mandatoryServices) {
        this.mandatoryServices.set('rabbitmq', false);
      }
    });
  }

  /**
   * Get stats about watched file systems
   *
   * @returns The stats
   */
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

  /**
   * Helper to send a heartbeat
   *
   * @param data The content of the heartbeat
   */
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
        service: data.service,
        err,
      });
    }
  }

  /**
   * Send main (self) heartbeat
   *
   * @param next Amount of milliseconds until next heartbeat
   */
  public async sendMainHeartbeat(next: number): Promise<void> {
    const filesystems = await this.getFilesystemStatus();

    const now = new Date();

    return this.sendHeartbeat({
      service: this.service.name,
      hostname: `${hostname()}:${process.pid}`,
      version: this.service.version,
      filesystems: filesystems.length > 0 ? filesystems : undefined,
      updatedAt: now,
      nextAt: new Date(now.getTime() + next),
    });
  }

  /**
   * Schedule next main heartbeat using static frequency
   */
  private scheduleNextMainHeartbeat(): void {
    const timeout = setTimeout(async () => {
      await this.sendMainHeartbeat(this.frequencyConfig.self);

      this.scheduleNextMainHeartbeat();
    }, this.frequencyConfig.self);

    this.timeoutByService.set('_self', timeout);
    this.frequencyByService.set('_self', {
      last: this.frequencyConfig.self,
      next: this.frequencyConfig.self,
    });
  }

  /**
   * Send a heartbeat for a connected service
   *
   * @param key The key of the service
   * @param ping How to ping service
   * @param frequency Amount of milliseconds until next heartbeat
   */
  private async sendConnectedHeartbeat(
    key: string,
    ping: HeartbeatConnectedServicePing,
    frequency: number
  ): Promise<void> {
    const timeout = frequency / 2;

    try {
      await Promise.race([
        // Try to connect to service
        ping().then((service) => {
          const now = new Date();

          this.sendHeartbeat({
            ...service,
            updatedAt: now,
            nextAt: new Date(now.getTime() + frequency),
          });
        }),
        // Throw on timeout
        sleep(timeout).then(() => {
          throw new Error('TimeoutError');
        }),
      ]);
    } catch (err) {
      this.logger.error({
        msg: 'Error when getting connected service',
        service: key,
        timeout,
        err,
      });

      this.frequencyByService.set(key, {
        last: frequency,
        next: this.frequencyConfig.connected.min,
      });
    }
  }

  /**
   * Schedule next main heartbeat using dynamic frequency
   *
   * @param key The key of the service
   * @param ping How to ping service
   */
  private scheduleConnectedHeartbeat(
    key: string,
    ping: HeartbeatConnectedServicePing
  ): void {
    const { min, max } = this.frequencyConfig.connected;

    const frequency = this.frequencyByService.get(key)?.next || min;

    const timeout = setTimeout(async () => {
      await this.sendConnectedHeartbeat(key, ping, frequency);

      this.scheduleConnectedHeartbeat(key, ping);
    }, frequency);

    const nextFrequency = Math.min(frequency * 2, max);

    this.timeoutByService.set(key, timeout);
    this.frequencyByService.set(key, {
      last: frequency,
      next: nextFrequency,
    });
  }

  /**
   * Send manually all heartbeats
   */
  public send(): void {
    this.sendMainHeartbeat(this.frequencyConfig.self);

    for (const [key, service] of this._watchingServices) {
      this.sendConnectedHeartbeat(
        key,
        service,
        this.frequencyConfig.connected.min
      );
    }
  }
}
