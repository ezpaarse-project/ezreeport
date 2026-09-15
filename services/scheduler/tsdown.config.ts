import { defineConfig } from 'tsdown';

export default defineConfig({
  copy: ['config'],
  entry: 'src/app.ts',
  format: 'cjs',
  minify: true,
  outDir: 'dist/',
  platform: 'node',
  sourcemap: true,
});
