import { ensureArray } from '@ezreeport/models/lib/utils';
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
  ignore: ensureArray(ignore),
  level: level as Level,
  dir,
};

export const appLogger = createLogger({ ...options, name: 'mail' });
