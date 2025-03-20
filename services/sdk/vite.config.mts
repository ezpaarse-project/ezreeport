import { join } from 'node:path';

import { defineConfig } from 'vite';

const src = (p = '') => join(__dirname, 'src/', p);

export default defineConfig({
  resolve: {
    alias: {
      '~': src(),
    },
  },

  build: {
    target: ['node14', 'es6'],
    outDir: 'dist',
    minify: 'esbuild',
    sourcemap: true,
    lib: {
      formats: ['cjs', 'es'],
      entry: {
        index: src('index.ts'),
        // Modules
        auth: src('modules/auth/index.ts'),
        crons: src('modules/crons/index.ts'),
        elastic: src('modules/elastic/index.ts'),
        health: src('modules/health/index.ts'),
        namespaces: src('modules/namespaces/index.ts'),
        generations: src('modules/generations/index.ts'),
        reports: src('modules/reports/index.ts'),
        tasks: src('modules/tasks/index.ts'),
        templates: src('modules/templates/index.ts'),
        'task-activity': src('modules/task-activity/index.ts'),
        'task-presets': src('modules/task-presets/index.ts'),
        // Helpers
        'helpers/aggregations': src('helpers/templates/editor/aggregations/index.ts'),
        'helpers/figures': src('helpers/templates/editor/figures/index.ts'),
        'helpers/filters': src('helpers/templates/editor/filters/index.ts'),
        'helpers/generations': src('helpers/generations/index.ts'),
        'helpers/layouts': src('helpers/templates/editor/layouts/index.ts'),
        'helpers/permissions': src('helpers/permissions/index.ts'),
        'helpers/task-presets': src('helpers/task-presets/index.ts'),
        'helpers/tasks': src('helpers/tasks/index.ts'),
        'helpers/templates': src('helpers/templates/index.ts'),
      },
    },
    rollupOptions: {
      external: [
        'ofetch',
        'nanoid',
        'object-hash',
        /^date-fns(\/.*)?/,
        'socket.io-client',
      ],
    },
  },
});
