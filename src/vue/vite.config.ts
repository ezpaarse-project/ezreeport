/// <reference types="histoire" />

// import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { HstVue } from '@histoire/plugin-vue2';
import vue2 from '@vitejs/plugin-vue2';
import Components from 'unplugin-vue-components/vite';
import { VuetifyResolver } from 'unplugin-vue-components/resolvers';
import vueI18nPlugin from './plugins/vite-i18n';

// TODO: build type def

export default defineConfig({
  plugins: [
    vue2(),
    vueI18nPlugin,
    Components({
      resolvers: [VuetifyResolver()],
      dts: '.vite/components.d.ts',
    }),
  ],
  histoire: {
    setupFile: '/histoire.setup.ts',
    plugins: [HstVue()],
    tree: {
      groups: [
        {
          id: 'utils',
          title: 'Utils',
          include: (file) => /^src\/components\/lib/i.test(file.path),
        },
        {
          id: 'health',
          title: 'Health',
        },
        {
          id: 'cron',
          title: 'Crons',
        },
        {
          id: 'task',
          title: 'Tasks',
        },
        {
          id: 'other',
          title: 'Others',
          include: () => true,
        },
      ],
    },
  },
  // resolve: {
  //   alias: {
  //     '@': fileURLToPath(new URL('./src', import.meta.url)),
  //     vue: 'vue/dist/vue.esm.js',
  //   },
  // },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ezReeportVue',
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': 'https://ezmesure.couperin.org/',
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
