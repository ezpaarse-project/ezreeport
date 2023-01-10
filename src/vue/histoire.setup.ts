/* eslint-disable import/prefer-default-export */
import { defineSetupVue2 } from '@histoire/plugin-vue2';
import Vue from 'vue';
import vuetify from './plugins/vuetify';
import vuePlugin from './src';

Vue.use(vuePlugin);

export const setupVue2 = defineSetupVue2(() => ({
  vuetify,
}));
