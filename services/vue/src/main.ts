import type { App } from 'vue';

import { registerComponents } from './components';
import { type LocalesOptions, registerLocales } from './locale';
import { type ErrorHandler, setErrorHandler } from './utils/errors';

type Options = {
  locale?: LocalesOptions;
  errorHandler?: ErrorHandler;
};

const vuePlugin = {
  install: (app: App, options: Options): void => {
    registerComponents(app);

    if (options.locale) {
      registerLocales(options.locale);
    }

    if (options.errorHandler) {
      setErrorHandler(options.errorHandler);
    }
  },
};

/**
 * Vue plugin in order to use ezREEPORT components
 */
// oxlint-disable-next-line import/no-default-export
export default vuePlugin;

export { prepareClient } from '@ezpaarse-project/ezreeport-sdk-js';
