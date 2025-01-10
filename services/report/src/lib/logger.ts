import pino from 'pino';

import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

import config from '~/lib/config';
import { ensureArray } from './utils';

export type Level = pino.Level;
type LoggerOptions = Omit<pino.LoggerOptions, 'level' | 'transports'> & { name: string };

const { level: l, dir, ignore: i } = config.log;
const ignore = ensureArray(i);
const level = l as pino.Level;

function isPrettierInstalled(): boolean {
  try {
    return !!require.resolve('pino-pretty');
  } catch {
    return false;
  }
}

function getStdOutTarget(): pino.TransportTargetOptions {
  // If no prettier is installed, send logs directly to stdout
  if (!isPrettierInstalled()) {
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
    mkdirSync(resolve(dir), { recursive: true });
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
