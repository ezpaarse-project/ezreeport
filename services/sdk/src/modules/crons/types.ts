export interface Cron {
  name: string;
  running: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export interface RawCron extends Omit<Cron, 'lastRun' | 'nextRun'> {
  lastRun?: string;
  nextRun?: string;
}

export type InputCron = Omit<Cron, 'name' | 'lastRun' | 'nextRun'>;
