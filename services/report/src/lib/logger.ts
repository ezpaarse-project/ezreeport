import pino from 'pino';

import { resolve } from 'node:path';

import config from '~/lib/config';

export type Level = pino.Level;
type LoggerOptions = Omit<pino.LoggerOptions, 'level' | 'transports'> & { name: string };

const { level: l, dir, ignore } = config.log;
const level = l as pino.Level;

function getStdOutTarget(): pino.TransportTargetOptions {
  if (process.env.NODE_ENV === 'production') {
    return { target: 'pino/file', options: { destination: 1 } };
  }

  return {
    target: 'pino-pretty',
    options: {
      ignore: [...ignore, 'scope'].join(','),
      colorize: true,
      messageFormat: '{if scope}[{scope}]{end} {msg}',
    },
  };
}

function createLogger(options: LoggerOptions) {
  const targets: pino.TransportTargetOptions[] = [
    { level, ...getStdOutTarget() },
  ];

  // If needed add logs into a file
  if (dir) {
    targets.push({
      target: 'pino/file',
      level,
      options: {
        destination: resolve(dir, `${options.name}.log`),
        sync: false,
        ignore: ignore.join(','),
      },
    });
  }

  return pino({
    ...options,
    level,
    transport: { targets },
  });
}

export const accessLogger = createLogger({ name: 'access' });
export const appLogger = createLogger({ name: 'app' });
