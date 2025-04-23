import { CronJob } from 'cron';

import type { Logger } from '@ezreeport/logger';

import type { Executor, CronType } from './types';

type TimersMapValue = { timer: string, executor: Executor };

export default function setupCrons<Timers extends string>(
  timers: Record<Timers, TimersMapValue>,
  logger: Logger,
) {
  const crons = new Map<Timers, CronJob>();

  const onTick = async (cron: { key: Timers; timer: string }, executor: Executor) => {
    const start = process.uptime();
    const tickLogger = logger.child({ cron });

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
  };

  const isCron = (timer: string): timer is Timers => Array.from<string>(crons.keys())
    .includes(timer);

  const formatCron = (name: Timers, job: CronJob): CronType => ({
    name,
    running: job.isActive,
    lastRun: job.lastDate() ?? undefined,
    nextRun: job.isActive ? job.nextDate().toJSDate() : undefined,
  });

  const getAllCrons = (): CronType[] => Array.from(crons.entries())
    .map(([name, job]) => formatCron(name, job));

  const stopCron = (cron: string): CronType | null => {
    if (!isCron(cron)) {
      return null;
    }

    const job = crons.get(cron)!;
    job.stop();

    return formatCron(cron, job);
  };

  const startCron = (cron: string): CronType | null => {
    if (!isCron(cron)) {
      return null;
    }

    const job = crons.get(cron)!;
    job.start();

    return formatCron(cron, job);
  };

  const forceCron = (cron: string): CronType | null => {
    if (!isCron(cron)) {
      return null;
    }

    const job = crons.get(cron)!;
    if (job.isCallbackRunning) {
      throw new Error(`cron ${cron} is already running`);
    }

    const { executor } = timers[cron];
    // Don't await promise to avoid waiting for cron to finish
    onTick({ key: cron, timer: job.cronTime.toString() }, executor);
    job.lastExecution = new Date();

    return formatCron(cron, job);
  };

  const init = async () => {
    await Promise.all(Object.entries<TimersMapValue>(timers).map(
      async ([key, { timer, executor }]) => {
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
          job = new CronJob(timer, () => onTick(cron, executor), null, true);
        } catch (err) {
          logger.error({
            msg: 'Failed to create cron',
            cron,
            err,
          });
          return;
        }

        crons.set(cron.key, job);
        logger.debug({
          msg: 'Created cron',
          cron,
        });
      },
    ));

    process.on('SIGTERM', () => {
      crons.forEach((job, key) => {
        job.stop();
        logger.debug({ msg: 'Cron stopped', cron: { key, timer: job.cronTime.toString() } });
      });
    });
  };

  init();

  return {
    getAllCrons,
    stopCron,
    startCron,
    forceCron,
  };
}
