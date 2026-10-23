// oxlint-disable import/no-nodejs-modules
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import type { StorybookConfig } from '@storybook/vue3-vite';
import autoImport from 'unplugin-auto-import/vite';
import { Vuetify3Resolver as vuetify } from 'unplugin-vue-components/resolvers';
import components from 'unplugin-vue-components/vite';
import vue from 'unplugin-vue/vite';

const require = createRequire(import.meta.url);

function getAbsolutePath(value: string): string {
  return dirname(require.resolve(join(value, 'package.json')));
}

function getProjectPath(value: string): string {
  return join(import.meta.dirname, '..', value);
}

const config: StorybookConfig = {
  addons: [
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-docs'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/vue3-vite'),
    options: {
      docgen: 'vue-component-meta',
    },
  },
  stories: [
    getProjectPath('src/**/*.mdx'),
    getProjectPath('src/**/*.stories.@(js|jsx|mjs|ts|tsx)'),
  ],
  // We're setting a configuration close to the one used to build (cf. tsdown.config.ts)
  viteFinal: async (viteConfig) => {
    const { mergeConfig } = await import('vite');

    return mergeConfig(viteConfig, {
      optimizeDeps: {
        exclude: ['~sdk', '@ezpaarse-project/ezreeport-sdk-js'],
      },

      plugins: [
        // Plugin for Vue SFC
        vue({}),
        // Plugin to auto import components (useful for dev)
        components({
          directoryAsNamespace: true,
          dirs: [getProjectPath('src/components/private/')],
          // Adding DTS for dev
          dts: getProjectPath('.vite/components.d.ts'),
          // Plugin for Vuetify Components
          resolvers: [vuetify()],
        }),
        // Plugin to auto import utils and composables (useful for dev)
        autoImport({
          dirs: [
            getProjectPath('src/composables/'),
            getProjectPath('src/utils/'),
          ],
          // Adding DTS for dev
          dts: getProjectPath('.vite/auto-imports.d.ts'),
          imports: ['vue', 'vue-i18n', '@vueuse/core'],
        }),
      ],

      resolve: {
        alias: [
          { find: '~', replacement: getProjectPath('src') },
          // Storybook can have a bit of trouble dealing with npm aliases
          {
            // oxlint-disable-next-line prefer-named-capture-group
            find: /^~sdk(\/.+)?/u,
            replacement: '@ezpaarse-project/ezreeport-sdk-js$1',
          },
        ],
      },
    });
  },
};

// oxlint-disable-next-line no-default-export
export default config;
