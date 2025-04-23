import setupCrons from '@ezreeport/crons';
import type { CronType } from '@ezreeport/crons/types';

import config from '~/lib/config';
import { appLogger } from '~/lib/logger';

import purgeOldReports from './executors/purgeOldReports';

const { timers } = config;

const logger = appLogger.child({ scope: 'crons' });

let service: ReturnType<typeof setupCrons> | undefined;

export function initCrons() {
  const start = process.uptime();

  service = setupCrons({
    purgeOldReports: {
      timer: timers.purgeOldReports,
      executor: purgeOldReports,
    },
  }, logger);

  logger.info({
    msg: 'Crons initialized',
    duration: process.uptime() - start,
    durationUnit: 's',
  });
}

export function getAllCrons(): CronType[] {
  if (!service) {
    throw new Error('Crons not initialized');
  }

  return service.getAllCrons();
}

export function stopCron(cron: string): CronType | null {
  if (!service) {
    throw new Error('Crons not initialized');
  }

  return service.stopCron(cron);
}

export function startCron(cron: string): CronType | null {
  if (!service) {
    throw new Error('Crons not initialized');
  }

  return service.startCron(cron);
}

export function forceCron(cron: string): CronType | null {
  if (!service) {
    throw new Error('Crons not initialized');
  }

  return service.forceCron(cron);
}
