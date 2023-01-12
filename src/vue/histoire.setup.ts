/* eslint-disable import/prefer-default-export */
import { defineSetupVue2 } from '@histoire/plugin-vue2';
import Vue from 'vue';
import Vuetify from 'vuetify/lib';
import { en, fr } from 'vuetify/src/locale';
import VueI18n from 'vue-i18n';
import vuePlugin from './src';
import '@mdi/font/css/materialdesignicons.min.css';

Vue.use(Vuetify);
Vue.use(VueI18n);
Vue.use(vuePlugin);

const i18n = new VueI18n({
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
});

const vuetify = new Vuetify({
  icons: {
    iconfont: 'mdi',
  },
  lang: {
    t: (key, ...params) => i18n.t(key, params),
  },
});

export const setupVue2 = defineSetupVue2(() => ({
  i18n,
  vuetify,
}));
