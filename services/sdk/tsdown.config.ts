import { defineConfig } from 'tsdown';

// oxlint-disable-next-line no-default-export
export default defineConfig({
  target: ['node14', 'es6'],
  platform: 'neutral',

  outDir: 'dist',
  minify: true,

  exports: true,

  dts: {
    sourcemap: true,
  },

  entry: {
    index: 'src/index.ts',
    // Modules
    auth: 'src/modules/auth/index.ts',
    crons: 'src/modules/crons/index.ts',
    elastic: 'src/modules/elastic/index.ts',
    health: 'src/modules/health/index.ts',
    namespaces: 'src/modules/namespaces/index.ts',
    recurrence: 'src/modules/recurrence/index.ts',
    generations: 'src/modules/generations/index.ts',
    reports: 'src/modules/reports/index.ts',
    tasks: 'src/modules/tasks/index.ts',
    templates: 'src/modules/templates/index.ts',
    'template-tags': 'src/modules/template-tags/index.ts',
    'task-activity': 'src/modules/task-activity/index.ts',
    'task-presets': 'src/modules/task-presets/index.ts',
    // Helpers
    'helpers/aggregations':
      'src/helpers/templates/editor/aggregations/index.ts',
    'helpers/figures': 'src/helpers/templates/editor/figures/index.ts',
    'helpers/filters': 'src/helpers/templates/editor/filters/index.ts',
    'helpers/generations': 'src/helpers/generations/index.ts',
    'helpers/layouts': 'src/helpers/templates/editor/layouts/index.ts',
    'helpers/permissions': 'src/helpers/permissions/index.ts',
    'helpers/task-presets': 'src/helpers/task-presets/index.ts',
    'helpers/tasks': 'src/helpers/tasks/index.ts',
    'helpers/templates': 'src/helpers/templates/index.ts',
  },

  alias: {
    '~': 'src/',
  },

  // Avoid bundling node APIs
  external: ['crypto'],
  // Bundling some dependencies to avoid issues
  noExternal: ['native-events', 'object-hash'],
});
