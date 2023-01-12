/* eslint-disable import/prefer-default-export */
import { defineSetupVue2 } from '@histoire/plugin-vue2';
import Vue from 'vue';
import Vuetify from 'vuetify/lib';
import VueI18n from 'vue-i18n';
import vuePlugin from './src';
import '@mdi/font/css/materialdesignicons.min.css';

Vue.use(Vuetify);
Vue.use(vuePlugin);
Vue.use(VueI18n);

export const setupVue2 = defineSetupVue2(() => ({
  vuetify: new Vuetify({
    icons: {
      iconfont: 'mdi',
    },
  }),
}));

export default new Vuetify({
  icons: {
    iconfont: 'mdi',
  },
});
