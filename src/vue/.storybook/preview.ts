/// <reference types="../src/types/env" />

import Vue from 'vue';
import Vuetify from 'vuetify';
import type { Decorator, Parameters } from '@storybook/vue';
import i18n from './plugins/i18n';
import vuetify from './plugins/vuetify';
import ezReeport from '../src';

// Setup Vuetify
Vue.use(Vuetify);

// Setup i18n
// eslint-disable-next-line no-underscore-dangle
Vue.prototype._i18n = i18n;

// Setup ezReeport plugin
Vue.use(ezReeport);
if (import.meta.env.VITE_EZMESURE_TOKEN) {
  Vue.prototype.$ezReeport.sdk.auth.login(import.meta.env.VITE_EZMESURE_TOKEN);
  console.info('[ezReeport-storybook] Auth token setup');
} else {
  console.warn('[ezReeport-storybook] Auth token not found');
}

export const parameters: Parameters = {};

export const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    defaultValue: 'light',
    toolbar: {
      icon: 'paintbrush',
      items: ['light', 'dark'],
      dynamicTitle: true,
    },
  },
  locale: {
    name: 'Locale',
    description: 'Internationalization locale',
    defaultValue: 'en',
    toolbar: {
      icon: 'globe',
      items: [
        { value: 'en', title: 'English' },
        { value: 'fr', title: 'Français' },
      ],
    },
  },
};

export const decorators: Decorator[] = [
  (story, context) => {
    const wrapped = story(context);

    return Vue.extend({
      name: 'StorybookPreview',
      vuetify,
      i18n,
      components: { wrapped },
      props: {
        theme: {
          type: String,
          default: context.globals.theme,
        },
        locale: {
          type: String,
          default: context.globals.locale,
        },
      },
      watch: {
        theme: {
          immediate: true,
          handler(val) {
            this.$vuetify.theme.dark = val === 'dark';
          },
        },
        locale: {
          immediate: true,
          handler(val) {
            this.$i18n.locale = val;
          },
        },
      },
      template: `
        <v-app>
          <v-container fluid>
            <wrapped />
          </v-container>
        </v-app>
      `,
    });
  },
];
