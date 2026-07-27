import { watch } from 'node:fs/promises';
import { hostname } from 'node:os';

import config from 'config';

const ERR_CAUSE = 'ERR_CONFIG_CHANGED';

type MinimalLogger = {
  log: (message: string) => void;
  levels?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

const DEFAULT_LEVELS = {
  debug: 20,
  info: 30,
  warn: 40,
} as const;

/**
 * Setup watcher for a config file
 *
 * @param path The path to watch
 * @param signal Signal to abort
 * @param logger Logger
 */
async function setupConfigWatcher(
  path: string,
  signal: AbortSignal,
  logger: MinimalLogger
): Promise<void> {
  const host = hostname();
  // Shorthand to log in a similar format as pino does
  const log = (msg: Record<string, unknown>): void =>
    logger.log(
      JSON.stringify({
        hostname: host,
        pid: process.pid,
        ...logger.meta,
        time: Date.now(),
        ...msg,
      })
    );

  try {
    const watcher = watch(path, { persistent: false, signal });
    log({
      level: logger.levels?.debug ?? DEFAULT_LEVELS.debug,
      msg: 'Watching config file',
      path,
    });

    for await (const event of watcher) {
      log({
        event,
        level: logger.levels?.info ?? DEFAULT_LEVELS.info,
        msg: 'Config changed, exiting...',
        path,
      });
      throw new Error('Config changed, exiting', { cause: ERR_CAUSE });
    }
  } catch (error) {
    if (error instanceof Error && error.cause === ERR_CAUSE) {
      throw error;
    }
    log({
      err: error,
      level: logger.levels?.warn ?? DEFAULT_LEVELS.warn,
      msg: 'Failed to watch config file',
      path,
    });
  }
}

/**
 * Watch all config sources
 *
 * @param logger Logger
 */
function watchConfigSources(logger: MinimalLogger): void {
  const sources = config.util.getConfigSources();
  if (sources.length > 0) {
    // Prepare watcher
    const { signal, abort } = new AbortController();
    process.on('SIGTERM', () => {
      abort();
      logger.log(
        JSON.stringify({
          hostname: hostname(),
          pid: process.pid,
          ...logger.meta,
          level: logger.levels?.debug ?? DEFAULT_LEVELS.debug,
          msg: 'Aborting config watcher',
          time: Date.now(),
        })
      );
    });

    for (const { name } of sources) {
      setupConfigWatcher(name, signal, logger);
    }
  }
}

type WatcherOptions = {
  logger: MinimalLogger;
};

type Options = {
  watch?: WatcherOptions;
};

/**
 * Setup config by making it type ready
 *
 * @param opts Options to setup config
 * @param opts.watch If provided, watch the config file and exit process on change
 *
 * @returns The parsed and typed config
 */
export function setupConfig<ConfigType>(opts: Options = {}): ConfigType {
  if (opts.watch) {
    watchConfigSources(opts.watch.logger);
  }

  return config as unknown as ConfigType;
}
