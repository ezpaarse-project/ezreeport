import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue2 from '@vitejs/plugin-vue2';
import Components from 'unplugin-vue-components/vite';
import { VuetifyResolver } from 'unplugin-vue-components/resolvers';
import VueI18nPlugin from './plugins/vite-i18n';

let comps = Components({
  dts: false,
});
if (process.env.NODE_ENV !== 'production') {
  console.log('building in dev mode');

  // Resolve Vuetify components in dev
  comps = Components({
    resolvers: [VuetifyResolver()],
    dts: '.vite/components.d.ts',
  });
}

export default defineConfig({
  plugins: [
    vue2(),
    VueI18nPlugin,
    comps,
  ],
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./src', import.meta.url)),
      vue: 'vue/dist/vue.esm.js',
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ezReeportVue',
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
      },
    },
  },
});
