/* eslint-disable import/no-import-module-exports */
import { mergeConfig, type UserConfig } from 'vite';
import type { StorybookConfig } from '@storybook/types';
import type { StorybookConfigVite } from '@storybook/builder-vite';
import viteConfig from '../vite.config';

const config: StorybookConfig & StorybookConfigVite = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/vue-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  typescript: {
    check: false,
  },
  viteFinal: async (cfg) => {
    const defConfig = viteConfig as UserConfig;

    return mergeConfig(cfg, {
      resolve: defConfig.resolve,
      server: defConfig.server,
      css: defConfig.css,
      optimizeDeps: {
        include: [
          'vuetify',
          'vue-i18n',
          'vuetify/src/locale',
          '@storybook/addon-essentials/docs/mdx-react-shim',
          '@storybook/blocks',
        ],
      },
    });
  },
};

module.exports = config;
