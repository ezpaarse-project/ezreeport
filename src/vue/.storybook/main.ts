/* eslint-disable import/no-import-module-exports */
import { mergeConfig } from 'vite';
import type { StorybookConfig } from '@storybook/types';
import type { StorybookConfigVite } from '@storybook/builder-vite';

const config: StorybookConfig & StorybookConfigVite = {
  stories: [
    {
      directory: '../src/components/internal',
      titlePrefix: 'Internal',
      files: '**/*.@(stories.@(js|jsx|ts|tsx)|mdx)',
    },
    {
      directory: '../src/components/public',
      titlePrefix: 'Public',
      files: '**/*.@(stories.@(js|jsx|ts|tsx)|mdx)',
    },
    {
      directory: '../src/components',
      titlePrefix: 'Get Started',
      files: 'GetStarted.mdx',
    },
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
  core: {
    builder: '@storybook/builder-vite',
  },
  typescript: {
    check: false,
  },
  viteFinal: (cfg) => mergeConfig(cfg, {
    optimizeDeps: {
      include: [
        'vuetify',
        'vue-i18n',
        'vuetify/src/locale',
        '@storybook/addon-essentials/docs/mdx-react-shim',
        '@storybook/blocks',
      ],
    },
  }),
};

module.exports = config;
