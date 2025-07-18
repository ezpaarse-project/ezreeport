import type { App } from 'vue';

import { setErrorHandler, type ErrorHandler } from './utils/errors';

import { registerLocales, type LocalesOptions } from './locale';
import { registerComponents } from './components';

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
export default vuePlugin;

export { prepareClient } from '@ezpaarse-project/ezreeport-sdk-js';
