import type { App } from 'vue';
import type { Composer as I18n } from 'vue-i18n';

import { setErrorHandler, type ErrorHandler } from './utils/errors';

import * as messages from './locale';
import * as components from './components';

declare module 'vue' {
  export interface GlobalComponents {
    EzrCronList: typeof components.EzrCronList,
    EzrHealthStatus: typeof components.EzrHealthStatus,
    EzrQueueList: typeof components.EzrQueueList,
    EzrTaskActivityTable: typeof components.EzrTaskActivityTable,
    EzrTaskCards: typeof components.EzrTaskCards,
    EzrTaskPresetTable: typeof components.EzrTaskPresetTable,
    EzrTaskTable: typeof components.EzrTaskTable,
    EzrTemplateTable: typeof components.EzrTemplateTable,
  }
}

function registerComponents(app: App) {
  app.component('ezr-cron-list', components.EzrCronList);
  app.component('ezr-health-status', components.EzrHealthStatus);
  app.component('ezr-queue-list', components.EzrQueueList);
  app.component('ezr-task-activity-table', components.EzrTaskActivityTable);
  app.component('ezr-task-cards', components.EzrTaskCards);
  app.component('ezr-task-preset-table', components.EzrTaskPresetTable);
  app.component('ezr-task-table', components.EzrTaskTable);
  app.component('ezr-template-table', components.EzrTemplateTable);
}

type LocalesOptions = {
  i18n: I18n,
  namespaces?: {
    label?: string | {
      en?: string,
      fr?: string,
    },
  },
};

type MessagesType = typeof messages[keyof typeof messages];

/**
 * Register ezREEPORT's messages into provided i18n
 *
 * @param options The options for registering locales
 */
function registerLocales(options: LocalesOptions) {
  for (const entry of Object.entries(messages)) {
    let [locale, msg] = entry as [keyof typeof messages, MessagesType];

    try {
      const namespaceLabel = typeof options.namespaces?.label === 'string'
        ? options.namespaces.label
        : options.namespaces?.label?.[locale];

      if (namespaceLabel) {
        msg = {
          ...msg,
          namespace: namespaceLabel,
        };
      }

      options.i18n.mergeLocaleMessage(locale, { $ezreeport: msg });
    } catch (err) {
      console.error('[ezreeport-vue]', err);
    }
  }
}

type Options = {
  locale?: LocalesOptions,
  errorHandler?: ErrorHandler
};

/**
 * Vue plugin in order to use ezREEPORT components
 */
export default {
  install: (app: App, options: Options) => {
    registerComponents(app);

    if (options.locale) {
      registerLocales(options.locale);
    }

    if (options.errorHandler) {
      setErrorHandler(options.errorHandler);
    }
  },
};

export { prepareClient } from '@ezpaarse-project/ezreeport-sdk-js';
