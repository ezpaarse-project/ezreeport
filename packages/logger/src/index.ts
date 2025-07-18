import pino from 'pino';

import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

export const logLevels = pino.levels;

export type Logger = pino.Logger;
export type Level = pino.Level;
export type LoggerOptions = Omit<pino.LoggerOptions, 'transports'> & {
  name: string;
  ignore: string[];
  dir?: string;
  pretty?: boolean;
};

export function isPrettierInstalled(req: NodeJS.Require): boolean {
  try {
    return !!req.resolve('pino-pretty');
  } catch {
    return false;
  }
}

function getStdOutTarget(options: LoggerOptions): pino.TransportTargetOptions {
  // If no prettier is installed, send logs directly to stdout
  if (!options.pretty) {
    return { target: 'pino/file', options: { destination: 1 } };
  }

  return {
    level: options.level,
    target: 'pino-pretty',
    options: {
      ignore: [...options.ignore, 'scope'].join(','),
      colorize: true,
      messageFormat: '{if scope}[{scope}]{end} {msg}',
    },
  };
}

export function createLogger(options: LoggerOptions): Logger {
  const targets: pino.TransportTargetOptions[] = [getStdOutTarget(options)];

  // If needed add logs into a file
  if (options.dir) {
    mkdirSync(resolve(options.dir), { recursive: true });
    targets.push({
      target: 'pino/file',
      level: options.level,
      options: {
        destination: resolve(options.dir, `${options.name}.log`),
        sync: false,
        ignore: options.ignore.join(','),
      },
    });
  }

  return pino({
    ...options,
    transport: { targets },
  });
}
