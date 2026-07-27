import {
  type Level,
  type LoggerOptions,
  createLogger,
  isPrettierInstalled,
} from '@ezreeport/logger';

import config from '~/lib/config';

const { level, dir, ignore } = config.log;

const options: Omit<LoggerOptions, 'name'> = {
  dir,
  ignore: Array.isArray(ignore) ? ignore : [ignore],
  level: level as Level,
  // oxlint-disable-next-line unicorn/prefer-module
  pretty: isPrettierInstalled(require),
};

export const appLogger = createLogger({ ...options, name: 'files' });
