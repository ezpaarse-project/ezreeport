import { createI18n } from 'vue-i18n';
import { en as enV, fr as frV } from 'vuetify/locale';

// oxlint-disable-next-line import/extensions
import enLocale from '../src/locales/en.json';
// oxlint-disable-next-line import/extensions
import frLocale from '../src/locales/fr.json';

// oxlint-disable-next-line no-explicit-any
export const i18n = createI18n<any>({
  fallbackLocale: 'en',
  legacy: false,
  locale: 'en',
  messages: {
    en: { $vuetify: enV, ...enLocale },
    fr: { $vuetify: frV, ...frLocale },
  },
});
