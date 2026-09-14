import { defineConfig } from 'tsdown';

export default defineConfig({
  copy: ['config'],
  entry: 'src/app.ts',
  format: 'cjs',
  minify: false,
  outDir: 'dist/',
  platform: 'node',
  sourcemap: true,
});
