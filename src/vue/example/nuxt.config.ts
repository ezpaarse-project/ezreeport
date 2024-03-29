import type { NuxtConfig } from '@nuxt/types';
// eslint-disable-next-line import/no-extraneous-dependencies
import colors from 'vuetify/es5/util/colors';
import path from 'node:path';

const config: NuxtConfig = {
  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    '~/plugins/ezreeport-vue2.ts',
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/typescript
    [
      '@nuxt/typescript-build',
      {
        typeCheck: {
          issue: {
            exclude: [
              { file: '../src/**/*' },
            ],
          },
        },
      },
    ],
    // https://go.nuxtjs.dev/vuetify
    '@nuxtjs/vuetify',
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    '@nuxtjs/i18n',
  ],

  i18n: {
    defaultLocale: 'fr',
    vueI18nLoader: true,
  },

  // Vuetify module configuration: https://go.nuxtjs.dev/config-vuetify
  vuetify: {
    customVariables: ['~/assets/variables.scss'],
    theme: {
      dark: true,
      themes: {
        dark: {
          primary: colors.purple.darken2,
          accent: colors.grey.darken3,
          secondary: colors.amber.darken3,
          info: colors.teal.lighten1,
          warning: colors.amber.base,
          error: colors.deepOrange.accent4,
          success: colors.green.accent3,
        },
        light: {
          primary: colors.purple.darken2,
          accent: colors.grey.darken3,
          secondary: colors.amber.darken3,
          info: colors.teal.lighten1,
          warning: colors.amber.base,
          error: colors.deepOrange.accent4,
          success: colors.green.accent3,
        },
      },
    },
  },

  publicRuntimeConfig: {
    authToken: process.env.AUTH_TOKEN,
  },

  extend(c: any) {
    // eslint-disable-next-line no-param-reassign
    c.resolve.alias.vue$ = path.resolve(__dirname, 'node_modules/vue/dist/vue.runtime.esm.js');
    // eslint-disable-next-line no-param-reassign
    c.resolve.alias['^vuetify'] = path.resolve(__dirname, 'node_modules/vuetify');
  },
};

export default config;
