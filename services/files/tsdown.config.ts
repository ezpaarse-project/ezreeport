import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    copy: ['config'],
    deps: {
      // Knex require some clients that we don't need
      neverBundle: [
        'mariadb/callback',
        'sqlite3',
        'mysql',
        'tedious',
        'oracledb',
      ],
    },
    entry: 'src/app.ts',
    format: 'cjs',
    minify: true,
    outDir: 'dist/',
    platform: 'node',
    sourcemap: true,
  },
  {
    entry: 'src/lib/knex/migrations/*',
    format: 'cjs',
    minify: true,
    outDir: 'dist/migrations',
    platform: 'node',
    sourcemap: true,
  },
]);
