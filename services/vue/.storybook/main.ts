import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import vue from 'unplugin-vue/vite';
import components from 'unplugin-vue-components/vite';
import { Vuetify3Resolver as vuetify } from 'unplugin-vue-components/resolvers';
import autoImport from 'unplugin-auto-import/vite';

import type { StorybookConfig } from '@storybook/vue3-vite';

const require = createRequire(import.meta.url);

function getAbsolutePath(value: string): string {
  return dirname(require.resolve(join(value, 'package.json')));
}

function getProjectPath(value: string): string {
  return join(__dirname, '..', value);
}

const config: StorybookConfig = {
  stories: [
    getProjectPath('src/**/*.mdx'),
    getProjectPath('src/**/*.stories.@(js|jsx|mjs|ts|tsx)'),
  ],
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
  // We're setting a configuration close to the one used to build (cf. tsdown.config.ts)
  viteFinal: async (config) => {
    const { mergeConfig } = await import('vite');

    return mergeConfig(config, {
      plugins: [
        // Plugin for Vue SFC
        vue({}),
        // Plugin to auto import components (useful for dev)
        components({
          dirs: [getProjectPath('src/components/private/')],
          directoryAsNamespace: true,
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
          imports: ['vue', 'vue-i18n', '@vueuse/core'],
          // Adding DTS for dev
          dts: getProjectPath('.vite/auto-imports.d.ts'),
        }),
      ],

      resolve: {
        alias: [
          { find: '~', replacement: getProjectPath('src') },
          // storybook can have a bit of trouble dealing with npm aliases
          {
            find: /^~sdk(\/.+)?/,
            replacement: '@ezpaarse-project/ezreeport-sdk-js$1',
          },
        ],
      },
    });
  },
};

// oxlint-disable-next-line no-default-export
export default config;
