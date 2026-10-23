import { defineConfig } from 'tsdown';

const isReleaseMode = process.env.NODE_ENV === 'release';

export default defineConfig({
  alias: {
    '~': 'src/',
  },
  deps: {
    neverBundle: ['native-events'],
  },
  dts: {
    generator: 'oxc',
    sourcemap: !isReleaseMode,
  },
  entry: {
    auth: 'src/modules/auth/index.ts',
    crons: 'src/modules/crons/index.ts',
    elastic: 'src/modules/elastic/index.ts',
    generations: 'src/modules/generations/index.ts',
    health: 'src/modules/health/index.ts',
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
    index: 'src/index.ts',
    namespaces: 'src/modules/namespaces/index.ts',
    recurrence: 'src/modules/recurrence/index.ts',
    reports: 'src/modules/reports/index.ts',
    'task-activity': 'src/modules/task-activity/index.ts',
    'task-presets': 'src/modules/task-presets/index.ts',
    tasks: 'src/modules/tasks/index.ts',
    'template-tags': 'src/modules/template-tags/index.ts',
    templates: 'src/modules/templates/index.ts',
  },
  exports: !isReleaseMode,
  format: ['cjs', 'es'],
  minify: isReleaseMode,
  outDir: 'dist',
  platform: 'neutral',
  target: ['node14', 'es6'],
});
