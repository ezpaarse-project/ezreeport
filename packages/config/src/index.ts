import config from 'config';

import { watch } from 'node:fs/promises';

/**
 * Setup watcher for a config file
 *
 * @param path The path to watch
 * @param signal Signal to abort
 * @param logger Logger
 */
async function setupConfigWatcher(path: string, signal: AbortSignal, logger: Console) {
  try {
    const watcher = watch(path, { persistent: false, signal });
    logger.debug(JSON.stringify({ msg: 'Watching config file', path }));

    for await (const event of watcher) {
      logger.info(JSON.stringify({ msg: 'Config changed, exiting...', event, path }));
      process.exit(42); // Why 42 ? Because this is the way of life.
    }
  } catch (err) {
    logger.warn({
      msg: 'Failed to watch config file',
      path,
      err,
    });
  }
}

/**
 * Watch all config sources
 *
 * @param logger Logger
 */
function watchConfigSources(logger: Console) {
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
  logger: Console,
};

type Options = {
  watch?: WatcherOptions,
};

/**
 * Setup config by making it type ready
 *
 * @param opts.watch If provided, watch the config file and exit process on change
 *
 * @returns The parsed and typed config
 */
export default function setupConfig<T>(opts: Options = {}) {
  if (opts.watch) {
    watchConfigSources(opts.watch.logger);
  }

  return config as unknown as T;
}
