import { CronJob } from 'cron';

import type { Logger } from '@ezreeport/logger';

import type { CronType, Executor } from './types';

type TimersMapValue = { timer: string; executor: Executor };

const formatCron = <Timers extends string>(
  name: Timers,
  job: CronJob
): CronType => ({
  lastRun: job.lastDate() ?? undefined,
  name,
  nextRun: job.isActive ? job.nextDate().toJSDate() : undefined,
  running: job.isActive,
});

export class CronManager<Timers extends string> {
  private crons = new Map<Timers, CronJob>();

  constructor(
    private timers: Record<Timers, TimersMapValue>,
    private logger: Logger
  ) {
    // Register crons
    for (const [key, { timer, executor }] of Object.entries<TimersMapValue>(
      timers
    )) {
      const cron = { key: key as Timers, timer };
      if (!executor) {
        logger.error({
          cron,
          msg: 'Cron is not implemented',
        });
        return;
      }
      try {
        const job = new CronJob(
          timer,
          () => this.onTick(cron, executor),
          null,
          true
        );

        this.crons.set(cron.key, job);
        logger.debug({
          cron,
          msg: 'Created cron',
        });
      } catch (error) {
        logger.error({
          cron,
          err: error,
          msg: 'Failed to create cron',
        });
        return;
      }
    }

    // Handle process exit
    process.on('SIGTERM', () => {
      for (const [key, job] of this.crons) {
        job.stop();
        logger.debug({
          cron: { key, timer: job.cronTime.toString() },
          msg: 'Cron stopped',
        });
      }
    });
  }

  private async onTick(
    cron: { key: Timers; timer: string },
    executor: Executor
  ): Promise<void> {
    const start = process.uptime();
    const tickLogger = this.logger.child({ cron });

    let result = null;
    try {
      tickLogger.debug({ msg: 'Executing cron' });
      result = await executor(tickLogger);
    } catch (error) {
      tickLogger.error({
        duration: process.uptime() - start,
        durationUnit: 's',
        err: error,
        msg: 'Failed to execute cron',
      });
    }

    tickLogger.info({
      duration: process.uptime() - start,
      durationUnit: 's',
      msg: 'Cron executed',
      ...result,
    });
  }

  public isCron(timer: string): timer is Timers {
    // oxlint-disable-next-line unicorn/prefer-spread - Need to cast as string
    return Array.from<string>(this.crons.keys()).includes(timer);
  }

  public getAllCrons(): CronType[] {
    return [...this.crons.entries()].map(([name, job]) =>
      formatCron(name, job)
    );
  }

  public stopCron(cron: string): CronType | null {
    if (!this.isCron(cron)) {
      return null;
    }

    const job = this.crons.get(cron)!;
    job.stop();

    return formatCron(cron, job);
  }

  public startCron(cron: string): CronType | null {
    if (!this.isCron(cron)) {
      return null;
    }

    const job = this.crons.get(cron)!;
    job.start();

    return formatCron(cron, job);
  }

  public forceCron(cron: string): CronType | null {
    if (!this.isCron(cron)) {
      return null;
    }

    const job = this.crons.get(cron)!;
    if (job.isCallbackRunning) {
      throw new Error(`cron ${cron} is already running`);
    }

    const { executor } = this.timers[cron];
    // Don't await promise to avoid waiting for cron to finish
    this.onTick({ key: cron, timer: job.cronTime.toString() }, executor);
    job.lastExecution = new Date();

    return formatCron(cron, job);
  }
}
