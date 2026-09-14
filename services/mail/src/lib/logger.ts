import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import pino from 'pino';

import { ensureArray } from '@ezreeport/models/lib/utils';

import config from '~/lib/config';

const ignore = ensureArray(config.log.ignore).join(',');

function createLogger(name: string): pino.Logger {
  const targets: pino.TransportTargetOptions[] = [];

  try {
    // Use pino-pretty if present
    createRequire('.').resolve('pino-pretty');
    targets.push({
      level: config.log.level,
      options: {
        colorize: true,
        ignore: [...ignore, 'scope'].join(','),
        messageFormat: '{if scope}[{scope}]{end} {msg}',
      },
      target: 'pino-pretty',
    });
  } catch {
    // Write logs to stdout
    targets.push({
      level: config.log.level,
      options: { destination: 1 },
      target: 'pino/file',
    });
  }

  // If needed add logs into a file
  if (config.log.dir) {
    // oxlint-disable-next-line node/no-sync - We want to ensure the dir before creating logger
    mkdirSync(config.log.dir, { recursive: true });
    targets.push({
      level: config.log.level,
      options: {
        destination: resolve(config.log.dir, `${name}.log`),
        ignore,
        sync: false,
      },
      target: 'pino/file',
    });
  }

  return pino({ transport: { targets } });
}

export const appLogger = createLogger('mail');
