/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */
import { defineSetupVue2 } from '@histoire/plugin-vue2';
import vuetify from './plugins/vuetify';

export const setupVue2 = defineSetupVue2(() => ({
  vuetify,
}));
