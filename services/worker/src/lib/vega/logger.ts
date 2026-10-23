import type { LoggerInterface } from 'vega';

import { appLogger } from '~/lib/logger';

const logger = appLogger.child({ name: 'vega' });

const logLevelToNumber = (level: string): number => {
  switch (level) {
    case 'error':
      return 1;
    case 'warn':
      return 2;
    case 'info':
      return 3;
    default:
      return 4;
  }
};

export class VegaLogger implements LoggerInterface {
  error(...messages: readonly string[]): this {
    logger.error({ messages });
    return this;
  }

  warn(...messages: readonly string[]): this {
    logger.warn({ messages });
    return this;
  }

  info(...messages: readonly string[]): this {
    logger.info({ messages });
    return this;
  }

  debug(...messages: readonly string[]): this {
    logger.debug({ messages });
    return this;
  }

  level(level: number): this;
  level(): number;
  level(level?: unknown): number | this {
    if (typeof level === 'number') {
      return this;
    }
    return logLevelToNumber(logger.level);
  }
}
