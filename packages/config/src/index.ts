import config from 'config';

import { watch } from 'node:fs/promises';

// const CONFIG_RELOAD_EXIT_CODE = 42; // Why 42 ? Because this is the way of life.

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
  logger: Console
): Promise<void> {
  try {
    const watcher = watch(path, { persistent: false, signal });
    logger.debug(JSON.stringify({ msg: 'Watching config file', path }));

    for await (const event of watcher) {
      logger.info(
        JSON.stringify({ event, msg: 'Config changed, exiting...', path })
      );
      // // oxlint-disable-next-line unicorn/no-process-exit
      // process.exit(CONFIG_RELOAD_EXIT_CODE);
      throw new Error('Config changed, exiting');
    }
  } catch (err) {
    logger.warn({
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
function watchConfigSources(logger: Console): void {
  const sources = config.util.getConfigSources();
  if (sources.length > 0) {
    // Prepare watcher
    const { signal, abort } = new AbortController();
    process.on('SIGTERM', () => {
      abort();
      logger.debug(JSON.stringify('Aborting config watcher'));
    });

    for (const { name } of sources) {
      setupConfigWatcher(name, signal, logger);
    }
  }
}

type WatcherOptions = {
  logger: Console;
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
