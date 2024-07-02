import {
  Debug,
  Error,
  Info,
  Warn,
  type LoggerInterface,
} from 'vega';
import { appLogger as logger } from '~/lib/logger';

const messagesToString = (messages: readonly string[]): string => messages.join('. ');

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

const logLevelToString = (l: number): string => {
  switch (l) {
    case Error:
      return 'error';
    case Warn:
      return 'warn';
    case Info:
      return 'info';
    case Debug:
    default:
      return 'debug';
  }
};

export default class VegaLogger implements LoggerInterface {
  error(...messages: readonly string[]): this {
    logger.error(`[vega] ${messagesToString(messages)}`);
    return this;
  }

  warn(...messages: readonly string[]): this {
    logger.warn(`[vega] ${messagesToString(messages)}`);
    return this;
  }

  info(...messages: readonly string[]): this {
    logger.info(`[vega] ${messagesToString(messages)}`);
    return this;
  }

  debug(...messages: readonly string[]): this {
    logger.debug(`[vega] ${messagesToString(messages)}`);
    return this;
  }

  level(l: number): this;
  level(): number;
  level(l?: unknown): number | this {
    if (typeof l === 'number' && [Error, Warn, Info, Debug].includes(l)) {
      const newLevel = logLevelToString(l);
      // eslint-disable-next-line no-restricted-syntax
      for (const transport of logger.transports) {
        transport.level = newLevel;
      }
      return this;
    }
    return logLevelToNumber(logger.level);
  }
}
