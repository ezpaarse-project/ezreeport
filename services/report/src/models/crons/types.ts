import { z } from '~/lib/zod';
import config from '~/lib/config';

type Timers = keyof typeof config.crons.timers;

/**
 * Validation for cron names
 */
export const CronName = z.enum(Object.keys(config.crons.timers) as [Timers, ...Timers[]]);

/**
 * Type for cron names
 */
export type CronNameType = z.infer<typeof CronName>;

/**
 * Validation for data passed to jobs
 */
export const CronData = z.object({
  timer: z.string().min(1)
    .describe('Cron timer'),

  key: CronName
    .describe('Cron name'),
});

/**
 * Type for data passed to jobs
 */
export type CronDataType = z.infer<typeof CronData>;

/**
 * Validation for a formatted cron
 */
export const CronDescription = z.object({
  name: CronName.readonly()
    .describe('Cron name'),

  running: z.boolean()
    .describe('Cron is running'),

  lastRun: z.date().nullable().readonly()
    .describe('Cron last run date'),

  nextRun: z.date().nullable().readonly()
    .describe('Cron next run date'),
});

/**
 * Type for a formatted cron
 */
export type CronDescriptionType = z.infer<typeof CronDescription>;

/**
 * Validation for editing cron
 */
export const InputCron = CronDescription.omit({
  // Strip readonly fields
  name: true,
  lastRun: true,
  nextRun: true,
}).strict();

/**
 * Type for editing cron
 */
export type InputCronType = z.infer<typeof InputCron>;
