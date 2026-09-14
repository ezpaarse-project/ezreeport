import { levels } from 'pino';

import { setupConfig } from '@ezreeport/config';

import type defaultConfig from '../../config/default.json';

// oxlint-disable-next-line import/no-default-export
export default setupConfig<typeof defaultConfig>({
  watch: {
    logger: {
      levels: levels.values,
      log: (message: string): boolean => process.stdout.write(`${message}\n`),
      meta: { name: 'scheduler', scope: 'config' },
    },
  },
});
