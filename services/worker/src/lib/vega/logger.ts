import { Debug, Error, Info, Warn, type LoggerInterface } from 'vega';

import { appLogger } from '~/lib/logger';

const logger = appLogger.child({ name: 'vega' });

const logLevelToNumber = (level: string): number => {
  switch (level) {
    case 'error':
      return Error;
    case 'warn':
      return Warn;
    case 'info':
      return Info;
    default:
      return Debug;
  }
};

export default class VegaLogger implements LoggerInterface {
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
