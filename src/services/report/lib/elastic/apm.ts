import apm from 'elastic-apm-node';
import type { Request, Response } from 'express';
import config from '~/lib/config';
import logger from '~/lib/logger';
import { formatInterval } from '~/lib/utils';
import serviceInfo from '~/package.json';

enum LogLevel {
  debug = 0,
  info,
  warn,
  error,
}

const logLevel = config.get('logLevel').toLowerCase() as 'debug' | 'info' | 'warn' | 'error';

let started = false;
const start = () => {
  const s = new Date();
  try {
    logger.debug('[apm] APM Starting');
    apm.start({
      serverUrl: 'http://apm:8200',
      serviceName: serviceInfo.name,
      serviceVersion: serviceInfo.version,
      centralConfig: false,
      logLevel, // Ignored since logger is provided
      logger: {
        fatal: (obj, msg, ...args) => {
          // Skip if not correct loglevel
          if (LogLevel[logLevel] <= LogLevel.error) return;

          let str = obj.toString();
          if (typeof obj === 'object' && typeof msg === 'string') {
            str = msg;
          }
          logger.error(`[apm] ${str}`, ...args);
        },
        error: (obj, msg, ...args) => {
          // Skip if not correct loglevel
          if (LogLevel[logLevel] <= LogLevel.error) return;

          let str = obj.toString();
          if (typeof obj === 'object' && typeof msg === 'string') {
            str = msg;
          }
          logger.error(`[apm] ${str}`, ...args);
        },
        warn: (obj, msg, ...args) => {
          // Skip if not correct loglevel
          if (LogLevel[logLevel] <= LogLevel.warn) return;

          let str = obj.toString();
          if (typeof obj === 'object' && typeof msg === 'string') {
            str = msg;
          }
          logger.warn(`[apm] ${str}`, ...args);
        },
        info: (obj, msg, ...args) => {
          // Skip if not correct loglevel
          if (LogLevel[logLevel] >= LogLevel.info) return;

          let str = obj.toString();
          if (typeof obj === 'object' && typeof msg === 'string') {
            str = msg;
          }
          logger.info(`[apm] ${str}`, ...args);
        },
        debug: (obj, msg, ...args) => {
          return; // Disabled because it's spamming the console
          // Skip if not correct loglevel
          if (LogLevel[logLevel] <= LogLevel.debug) return;

          let str = obj.toString();
          if (typeof obj === 'object' && typeof msg === 'string') {
            str = msg;
          }
          logger.debug(`[apm] ${str}`, ...args);
        },
        trace: (obj, msg, ...args) => {
          return; // Disabled because it's spamming the console
          // Skip if not correct loglevel
          if (LogLevel[logLevel] <= LogLevel.debug) return;

          let str = obj.toString();
          if (typeof obj === 'object' && typeof msg === 'string') {
            str = msg;
          }
          logger.debug(`[apm] ${str}`, ...args);
        },
      },
    });

    apm.handleUncaughtExceptions((err) => {
      logger.error(`\x1b[31m${err.stack}\x1b[0m`);
      process.exit(1);
    });

    const dur = formatInterval({ start: s, end: new Date() });
    logger.info(`[apm] APM started in ${dur}s`);
    started = true;
  } catch (error) {
    const dur = formatInterval({ start: s, end: new Date() });
    logger.error(`[apm] APM init failed in ${dur}s with error: ${(error as Error).message}`);
    started = false;
  }
};
start();

export const sendError = (error: Error, request?: Request, response?: Response) => {
  if (!started) {
    start();
  }
  apm.captureError(
    error,
    { request, response },
    (err, _id) => {
      logger.error(`[apm] APM failed to send error: ${err?.message ?? error.message}`);
    },
  );
};

export default apm;
