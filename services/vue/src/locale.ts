import type { Composer as I18n } from 'vue-i18n';

import enLocale from '~/locales/en.json';
import frLocale from '~/locales/fr.json';

const messages = {
  en: enLocale.$ezreeport,
  fr: frLocale.$ezreeport,
};

type MessagesType = (typeof messages)[keyof typeof messages];

export type LocalesOptions = {
  i18n: I18n;
  namespaces?: {
    label?:
      | string
      | {
          en?: string;
          fr?: string;
        };
  };
};

/**
 * Register ezREEPORT's messages into provided i18n
 *
 * @param options The options for registering locales
 */
export function registerLocales(options: LocalesOptions): void {
  for (const entry of Object.entries(messages)) {
    let [locale, msg] = entry as [keyof typeof messages, MessagesType];

    try {
      const namespaceLabel =
        typeof options.namespaces?.label === 'string'
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
      handleEzrError('Unable to register locales', err);
    }
  }
}
