import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { HstVue } from '@histoire/plugin-vue2';
import vue2 from '@vitejs/plugin-vue2';
import Components from 'unplugin-vue-components/vite';
import { VuetifyResolver } from 'unplugin-vue-components/resolvers';
import type { TreeGroupConfig } from 'histoire';
import vueI18nPlugin from './plugins/vite-i18n';

// TODO: build type def

const compsRoot = '^src/components';
const compsGrps: TreeGroupConfig[] = [
  {
    id: 'utils',
    title: 'Utils (internal)',
    include: ({ path }) => new RegExp(`${compsRoot}/common/`, 'i').test(path),
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
    id: 'institution',
    title: 'Institutions',
  },
  {
    id: 'history',
    title: 'History entries',
  },
  {
    id: 'other',
    title: 'Others',
    include: () => true,
  },
];

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
      file: ({ title, path }) => {
        // Parse internal components
        const matches = new RegExp(`${compsRoot}/lib/(?<group>[a-z]+)/(?<tree>.*).story.vue$`, 'i').exec(path);
        if (matches?.groups?.tree) {
          return ['internal', ...matches.groups.tree.split('/')];
        }
        // Falback to default
        return title.split('/');
      },
      groups: compsGrps.map(({ id, title, include }) => ({
        id,
        title,
        include: include || (({ path }) => new RegExp(`${compsRoot}/lib/${id}/`, 'i').test(path)),
      })),
    },
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./src', import.meta.url)),
      '@': fileURLToPath(new URL('./src/components', import.meta.url)),
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
