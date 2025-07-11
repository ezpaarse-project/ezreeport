import { CronManager } from '@ezreeport/crons';
import type { CronType } from '@ezreeport/crons/types';

import config from '~/lib/config';
import { appLogger } from '~/lib/logger';

import generateReports from './executors/generateReports';

const logger = appLogger.child({ scope: 'crons' });

const timers = {
  purgeOldReports: {
    timer: config.timers.generateReports,
    executor: generateReports,
  },
};

let manager: CronManager<keyof typeof timers> | undefined;

export function initCrons(): void {
  const start = process.uptime();

  manager = new CronManager(timers, logger);

  logger.info({
    msg: 'Crons initialized',
    duration: process.uptime() - start,
    durationUnit: 's',
  });
}

export function getAllCrons(): CronType[] {
  if (!manager) {
    throw new Error('Crons not initialized');
  }

  return manager.getAllCrons();
}

export function stopCron(cron: string): CronType | null {
  if (!manager) {
    throw new Error('Crons not initialized');
  }

  return manager.stopCron(cron);
}

export function startCron(cron: string): CronType | null {
  if (!manager) {
    throw new Error('Crons not initialized');
  }

  return manager.startCron(cron);
}

export function forceCron(cron: string): CronType | null {
  if (!manager) {
    throw new Error('Crons not initialized');
  }

  return manager.forceCron(cron);
}
