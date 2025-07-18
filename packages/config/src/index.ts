import { hostname } from 'node:os';
import { watch } from 'node:fs/promises';

import config from 'config';

const ERR_CAUSE = 'ERR_CONFIG_CHANGED';

type MinimalLogger = {
  log: (message: string) => void;
  levels?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

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
        pid: process.pid,
        hostname: host,
        ...logger.meta,
        time: Date.now(),
        ...msg,
      })
    );

  try {
    const watcher = watch(path, { persistent: false, signal });
    log({
      level: logger.levels?.debug ?? 20,
      msg: 'Watching config file',
      path,
    });

    for await (const event of watcher) {
      log({
        level: logger.levels?.info ?? 30,
        event,
        msg: 'Config changed, exiting...',
        path,
      });
      throw new Error('Config changed, exiting', { cause: ERR_CAUSE });
    }
  } catch (err) {
    if (err instanceof Error && err.cause === ERR_CAUSE) {
      throw err;
    }
    log({
      level: logger.levels?.warn ?? 40,
      err,
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
          pid: process.pid,
          hostname: hostname(),
          ...logger.meta,
          time: Date.now(),
          level: logger.levels?.debug ?? 20,
          msg: 'Aborting config watcher',
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
