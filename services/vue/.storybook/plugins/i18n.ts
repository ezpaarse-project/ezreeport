import Vue from 'vue';
import VueI18n from 'vue-i18n';
import { en, fr } from 'vuetify/src/locale';

Vue.use(VueI18n);

export const options = {
  locale: 'en',
  messages: {
    en: {
      $vuetify: en,
    },
    fr: {
      $vuetify: fr,
    },
  },
  silentFallbackWarn: true,
};

export default new VueI18n(options);
