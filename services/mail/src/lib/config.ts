import { setupConfig } from '@ezreeport/config';
import { logLevels } from '@ezreeport/logger';

import type defaultConfig from '../../config/default.json';

// oxlint-disable-next-line import/no-default-export
export default setupConfig<typeof defaultConfig>({
  watch: {
    logger: {
      levels: logLevels.values,
      log: (message: string): boolean => process.stdout.write(`${message}\n`),
      meta: { name: 'mail', scope: 'config' },
    },
  },
});
