/// <reference types="histoire" />

// import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { HstVue } from '@histoire/plugin-vue2';
import vue2 from '@vitejs/plugin-vue2';
import Components from 'unplugin-vue-components/vite';
import { VuetifyResolver } from 'unplugin-vue-components/resolvers';

export default defineConfig({
  plugins: [
    vue2(),
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
          id: 'internal',
          title: 'Internal',
          include: (file) => /^src\/components\/lib/i.test(file.path),
        },
        {
          id: 'health',
          title: 'Health',
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
      name: 'ReportingVue',
      fileName: 'reporting-vue',
    },
    rollupOptions: {
      // TODO: Test as a package
      external: ['vue', 'vuetify/lib'],
      output: {
        globals: {
          vue: 'Vue',
          'vuetify/lib': 'Vuetify',
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
