import {
  Debug,
  Error,
  Info,
  Warn,
  type LoggerInterface,
} from 'vega';
import { appLogger } from '~/lib/logger';

const logger = appLogger.child({ name: 'vega' });

const logLevelToNumber = (l: string): number => {
  switch (l) {
    case 'error':
      return Error;
    case 'warn':
      return Warn;
    case 'info':
      return Info;
    case 'debug':
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

  level(l: number): this;
  level(): number;
  level(l?: unknown): number | this {
    if (typeof l === 'number') {
      return this;
    }
    return logLevelToNumber(logger.level);
  }
}
