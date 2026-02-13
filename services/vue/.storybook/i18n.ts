import { createI18n } from 'vue-i18n';
import { en as enV, fr as frV } from 'vuetify/locale';

import enLocale from '../src/locales/en.json';
import frLocale from '../src/locales/fr.json';

// oxlint-disable-next-line no-explicit-any
export const i18n = createI18n<any>({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: { $vuetify: enV, ...enLocale },
    fr: { $vuetify: frV, ...frLocale },
  },
});
