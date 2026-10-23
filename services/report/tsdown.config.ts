import { defineConfig } from 'tsdown';

export default defineConfig({
  copy: [
    'config',
    {
      from: 'src/routes/v2/unsubscribe/public',
      to: 'dist/',
    },
  ],
  entry: 'src/app.ts',
  format: 'cjs',
  minify: true,
  outDir: 'dist/',
  platform: 'node',
  sourcemap: true,
});
