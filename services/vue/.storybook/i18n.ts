import { createI18n } from 'vue-i18n';
import { en, fr } from 'vuetify/locale';

import messages from '@intlify/unplugin-vue-i18n/messages';

export default createI18n<any>({
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: { $vuetify: en, ...messages?.en },
    fr: { $vuetify: fr, ...messages?.fr },
  },
});
