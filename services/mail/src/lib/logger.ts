import { ensureArray } from '~common/lib/utils';
import {
  createLogger,
  isPrettierInstalled,
  type Level,
  type LoggerOptions
} from '~common/lib/logger';

import config from '~/lib/config';

const { level, dir, ignore } = config.log;

const options: Omit<LoggerOptions, 'name'> = {
  pretty: isPrettierInstalled(require),
  ignore: ensureArray(ignore),
  level: level as Level,
  dir,
};

// eslint-disable-next-line import/prefer-default-export
export const appLogger = createLogger({ ...options, name: 'mail' });
export const accessLogger = createLogger({ ...options, name: 'access' });
