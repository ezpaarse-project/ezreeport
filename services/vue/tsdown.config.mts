import { defineConfig } from 'tsdown';
import autoImport from 'unplugin-auto-import/rolldown';
import { Vuetify3Resolver as vuetify } from 'unplugin-vue-components/resolvers';
import components from 'unplugin-vue-components/rolldown';
import vue from 'unplugin-vue/rolldown';

const isReleaseMode = process.env.NODE_ENV === 'production';

export default defineConfig({
  alias: {
    '~': 'src/',
  },
  css: {
    splitting: false,
  },
  deps: {
    onlyBundle: [
      '@ezpaarse-project/ezreeport-sdk-js',
      '~sdk',
      'events',
      'object-hash',
    ],
  },
  dts: {
    sourcemap: !isReleaseMode,
    vue: true,
  },
  entry: {
    components: 'src/components.ts',
    index: 'src/main.ts',
    locale: 'src/locale.ts',
  },
  format: 'es',
  loader: {
    // Matching Vite behaviour
    '.svg': 'dataurl',
  },
  minify: isReleaseMode,
  outDir: 'dist',
  platform: 'browser',
  plugins: [
    // Plugin for Vue SFC
    vue({ isProduction: isReleaseMode, ssr: false }),
    // Plugin to resolve auto-imports for components
    components({
      directoryAsNamespace: true,
      dirs: ['src/components/private/'],
      dts: false,
      // Plugin for Vuetify Components
      // /!\ Doesn't resolve directives
      resolvers: [vuetify()],
    }),
    // Plugin to resolve auto-imports for utils and composables
    autoImport({
      dirs: ['src/composables/', 'src/utils/'],
      dts: false,
      imports: ['vue', 'vue-i18n', '@vueuse/core'],
    }),
  ],
  target: 'es6',
});
