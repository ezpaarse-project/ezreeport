/* eslint-disable import/no-import-module-exports */
import { mergeConfig } from 'vite';
import type { StorybookConfig } from '@storybook/types';
import type { StorybookConfigVite } from '@storybook/builder-vite';
import remarkGfm from 'remark-gfm';

const config: StorybookConfig & StorybookConfigVite = {
  stories: [
    {
      directory: '../src/components/internal',
      titlePrefix: 'Internal',
      files: '**/*.@(stories.@(js|jsx|ts|tsx))',
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
    {
      name: '@storybook/addon-docs',
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
  ],
  framework: {
    name: '@storybook/vue-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  core: {},
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
