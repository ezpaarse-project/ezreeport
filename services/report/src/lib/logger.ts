import pino from 'pino';
import pretty from 'pino-pretty';

import { resolve } from 'node:path';

import config from '~/lib/config';

type LoggerOptions = Omit<pino.LoggerOptions, 'level'> & { name: string };

const { level: l, dir, ignore } = config.log;
const level = l as pino.Level;

function getStdOut() {
  if (process.env.NODE_ENV === 'production') {
    return process.stdout;
  }

  // Setup pretty logger on dev
  return pretty({
    ignore: [...ignore, 'scope'].join(','),
    colorize: true,
    messageFormat: ({ scope, msg }) => {
      if (scope) {
        return `[${scope}] ${msg || ''}`;
      }
      return `${msg || ''}`;
    },
  });
}

function createLogger(options: LoggerOptions) {
  const streams: pino.StreamEntry[] = [{ level, stream: getStdOut() }];

  // If needed add logs into a file
  if (dir) {
    streams.push({
      level,
      stream: pino.destination({
        dest: resolve(dir, `${options.name}.log`),
        sync: false,
        ignore: ignore.join(','),
      }),
    });
  }

  return pino(
    { ...options, level },
    pino.multistream(streams),
  );
}

export const accessLogger = createLogger({ name: 'access' });
export const appLogger = createLogger({ name: 'app' });
