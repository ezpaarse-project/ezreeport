import type { Job } from 'bullmq';

import { initQueues } from '~/lib/bull';
import type { CronData } from '~/lib/cron';
import { appLogger as logger } from '~/lib/logger';

export default async (job: Job<CronData>) => {
  try {
    initQueues(true, true);

    const { default: executor } = await import(`./${job.data.key}.ts`);
    return executor(job);
  } catch (error) {
    logger.warn(`[cron] [${process.pid}] [${job.name}] Unexpected error occurred when dispatching executor: {${error}}`);
    return { error };
  }
};
