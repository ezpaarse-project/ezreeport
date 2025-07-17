import { createI18n } from 'vue-i18n';
import { en as enV, fr as frV } from 'vuetify/locale';

import { en as enR, fr as frR } from '../src/locale';

// oxlint-disable-next-line no-explicit-any
export default createI18n<any>({
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: { $vuetify: enV, $ezreeport: enR },
    fr: { $vuetify: frV, $ezreeport: frR },
  },
});
