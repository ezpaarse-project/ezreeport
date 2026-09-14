import { defineConfig } from 'tsdown';

export default defineConfig({
  copy: ['config', 'assets'],
  entry: 'src/app.ts',
  format: 'cjs',
  minify: false,
  outDir: 'dist/',
  platform: 'node',
  sourcemap: true,
});
