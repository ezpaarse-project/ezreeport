import {
  type Level,
  type LoggerOptions,
  createLogger,
  isPrettierInstalled,
} from '@ezreeport/logger';
import { ensureArray } from '@ezreeport/models/lib/utils';

import config from '~/lib/config';

const { level, dir, ignore } = config.log;

const options: Omit<LoggerOptions, 'name'> = {
  dir,
  ignore: ensureArray(ignore),
  level: level as Level,
  // oxlint-disable-next-line unicorn/prefer-module
  pretty: isPrettierInstalled(require),
};

export const appLogger = createLogger({ ...options, name: 'api' });
export const accessLogger = createLogger({ ...options, name: 'access' });
