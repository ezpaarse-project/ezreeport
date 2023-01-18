/* eslint-disable import/no-import-module-exports */
import { mergeConfig, type UserConfig } from 'vite';
import type { StorybookConfig } from '@storybook/builder-vite';
import viteConfig from '../vite.config';

const config: StorybookConfig = {
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
    });
  },
};

module.exports = config;
