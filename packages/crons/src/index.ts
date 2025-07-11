import { CronJob } from 'cron';

import type { Logger } from '@ezreeport/logger';

import type { Executor, CronType } from './types';

type TimersMapValue = { timer: string; executor: Executor };

const formatCron = <Timers extends string>(
  name: Timers,
  job: CronJob
): CronType => ({
  name,
  running: job.isActive,
  lastRun: job.lastDate() ?? undefined,
  nextRun: job.isActive ? job.nextDate().toJSDate() : undefined,
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
          msg: 'Cron is not implemented',
          cron,
        });
        return;
      }

      let job;
      try {
        job = new CronJob(timer, () => this.onTick(cron, executor), null, true);
      } catch (err) {
        logger.error({
          msg: 'Failed to create cron',
          cron,
          err,
        });
        return;
      }

      this.crons.set(cron.key, job);
      logger.debug({
        msg: 'Created cron',
        cron,
      });
    }

    // Handle process exit
    process.on('SIGTERM', () => {
      for (const [key, job] of this.crons) {
        job.stop();
        logger.debug({
          msg: 'Cron stopped',
          cron: { key, timer: job.cronTime.toString() },
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

    let result;
    try {
      tickLogger.debug({ msg: 'Executing cron' });
      result = await executor(tickLogger);
    } catch (err) {
      tickLogger.error({
        msg: 'Failed to execute cron',
        duration: process.uptime() - start,
        durationUnit: 's',
        err,
      });
    }

    tickLogger.info({
      msg: 'Cron executed',
      duration: process.uptime() - start,
      durationUnit: 's',
      ...result,
    });
  }

  public isCron(timer: string): timer is Timers {
    return Array.from<string>(this.crons.keys()).includes(timer);
  }

  public getAllCrons(): CronType[] {
    return Array.from(this.crons.entries()).map(([name, job]) =>
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
