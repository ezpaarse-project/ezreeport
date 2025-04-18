import {
  createLogger,
  isPrettierInstalled,
  type Level,
  type LoggerOptions,
} from '@ezreeport/logger';

import config from '~/lib/config';

const { level, dir, ignore } = config.log;

const options: Omit<LoggerOptions, 'name'> = {
  pretty: isPrettierInstalled(require),
  ignore: Array.isArray(ignore) ? ignore : [ignore],
  level: level as Level,
  dir,
};

// eslint-disable-next-line import/prefer-default-export
export const appLogger = createLogger({ ...options, name: 'io' });
