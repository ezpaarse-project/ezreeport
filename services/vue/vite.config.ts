import { resolve } from 'node:path';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import vuetify from 'vite-plugin-vuetify';
import components from 'unplugin-vue-components/vite';
import autoImport from 'unplugin-auto-import/vite';

const VITE_CACHE_DIR = resolve(__dirname, '.vite');
const SRC_DIR = resolve(__dirname, 'src');
const COMPONENTS_DIR = resolve(SRC_DIR, 'components');

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Plugin for Vue SFC
    vue(),
    // Plugin for Vuetify Components
    vuetify({
      autoImport: true,
    }),
    // Plugin to auto import components (useful for dev)
    components({
      dts: resolve(VITE_CACHE_DIR, 'components.d.ts'),
      dirs: [resolve(COMPONENTS_DIR, 'private')],
      directoryAsNamespace: true,
    }),
    // Plugin to auto import utils and composables (useful for dev)
    autoImport({
      dts: resolve(VITE_CACHE_DIR, 'auto-imports.d.ts'),
      dirs: [resolve(SRC_DIR, 'composables'), resolve(SRC_DIR, 'utils')],
      imports: ['vue', 'vue-i18n', '@vueuse/core'],
    }),
    // Plugin to output main DTS into dist
    dts({
      rollupTypes: false,
      entryRoot: './src',
      tsconfigPath: './tsconfig.app.json',
    }),
  ],

  resolve: {
    alias: [
      { find: '~', replacement: SRC_DIR },
      // alias for sdk
      {
        find: /^~sdk(\/.+)?/,
        replacement: '@ezpaarse-project/ezreeport-sdk-js$1',
      },
    ],
  },

  build: {
    lib: {
      formats: ['es'],
      entry: {
        main: resolve(SRC_DIR, 'main.ts'),
        locale: resolve(SRC_DIR, 'locale.ts'),
        components: resolve(SRC_DIR, 'components.ts'),
      },
    },
    rollupOptions: {
      external: [
        'vue',
        /^vuetify(\/.*)?/,
        'vue-i18n',
        '@vueuse/core',
        /^date-fns(\/.*)?/,
        'marked',
        'dompurify',
        '@formkit/drag-and-drop/vue',
        'chroma',
        'pretty-bytes',

        // We want to bundle the SDK, not it's dependencies
        'nanoid',
        // 'object-hash', // Bundling object-hash to avoid issues
        'ofetch',
        'socket.io-client',
      ],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
});
