import { defineConfig } from 'tsdown';

import vue from 'unplugin-vue/rolldown';
import components from 'unplugin-vue-components/rolldown';
import { Vuetify3Resolver as vuetify } from 'unplugin-vue-components/resolvers';
import autoImport from 'unplugin-auto-import/rolldown';

const isReleaseMode = process.env.NODE_ENV === 'production';

// oxlint-disable-next-line no-default-export
export default defineConfig({
  target: 'es6',
  format: 'es',
  platform: 'browser',

  outDir: 'dist',
  minify: isReleaseMode,

  dts: {
    sourcemap: !isReleaseMode,
    vue: true,
  },

  entry: {
    index: 'src/main.ts',
    components: 'src/components.ts',
    locale: 'src/locale.ts',
  },

  // Workaround to have "./styles" in exports
  // can break if CSS is too big
  outputOptions: {
    cssChunkFileNames: '[name].styles.css',
  },
  exports: {
    customExports(pkg) {
      pkg['./styles'] = './dist/components.styles.css';
      return pkg;
    },
  },

  alias: {
    '~': 'src/',
  },

  plugins: [
    // Plugin for Vue SFC
    vue({ isProduction: isReleaseMode, ssr: false }),
    // Plugin to resolve auto-imports for components
    components({
      dirs: ['src/components/private/'],
      directoryAsNamespace: true,
      dts: false,
      // Plugin for Vuetify Components
      resolvers: [vuetify()], // /!\ Doesn't resolve directives
    }),
    // Plugin to resolve auto-imports for utils and composables
    autoImport({
      dirs: ['src/composables/', 'src/utils/'],
      imports: ['vue', 'vue-i18n', '@vueuse/core'],
      dts: false,
    }),
  ],
});
