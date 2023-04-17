/// <reference types="../src/types/env" />

import Vue, { defineComponent } from 'vue';
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
if (!import.meta.env.VITE_AUTH_TOKEN) {
  console.warn('[ezReeport-storybook] Auth token not found');
}

export const parameters: Parameters = {
  options: {
    storySort: {
      order: [
        'Public',
        'Internal',
      ],
    },
  },
};

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
  (story, context) => defineComponent({
    name: 'StorybookPreview',
    vuetify,
    i18n,
    components: { story: story(context) },
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
    data: () => ({
      token: import.meta.env.VITE_AUTH_TOKEN,
    }),
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
    computed: {
      namespaceLabel() {
        return {
          en: 'namespace | namespaces',
          fr: 'établissement | établissements',
        };
      },
    },
    template: `
        <v-app>
          <ezr-provider :token="token" :namespaceLabel="namespaceLabel">
            <v-container fluid>
              <story />
            </v-container>
          </ezr-provider>
        </v-app>
      `,
  }),
];
