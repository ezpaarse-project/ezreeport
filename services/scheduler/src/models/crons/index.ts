import { CronJob } from 'cron';

import config from '~/lib/config';
import { appLogger } from '~/lib/logger';

import type { Timers, Executor } from './types';
import generateReports from './generateReports';
import purgeOldReports from './purgeOldReports';

const { timers } = config;

const logger = appLogger.child({ scope: 'crons' });

const crons = new Map<Timers, CronJob>();
const executors: Record<Timers, Executor> = {
  generateReports,
  purgeOldReports,
};

async function onTick(cron: { key: Timers; timer: string }, executor: Executor) {
  const s = process.uptime();
  const l = logger.child({ cron });

  let result;
  try {
    l.debug({ msg: 'Executing cron' });
    result = await executor(l);
  } catch (err) {
    l.error({
      msg: 'Failed to execute cron',
      duration: process.uptime() - s,
      durationUnit: 's',
      err,
    });
    // TODO: send mail
  }

  l.info({
    msg: 'Cron executed',
    duration: process.uptime() - s,
    durationUnit: 's',
    ...result,
  });
}

// eslint-disable-next-line import/prefer-default-export
export async function initCrons() {
  const start = process.uptime();

  await Promise.all(
    Object.entries(timers).map(async ([key, timer]) => {
      const cron = { key: key as Timers, timer };
      const executor = executors[cron.key];
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
    }),
  );

  logger.info({
    msg: 'Crons initialized',
    duration: process.uptime() - start,
    durationUnit: 's',
  });
}

process.on('SIGTERM', () => {
  crons.forEach((job, key) => {
    job.stop();
    logger.debug({ msg: 'Cron stopped', cron: { key, timer: job.cronTime.toString() } });
  });
});
