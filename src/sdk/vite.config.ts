import { resolve } from 'path';
// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from 'vite';

// TODO: fix node build

const target = (process.env.BUILD_TARGET || 'browser') as 'browser' | 'node';
console.log('i Building for', target);

export default defineConfig({
  build: {
    sourcemap: true,
    target: target === 'node' ? 'node14' : 'modules',
    outDir: target === 'node' ? 'dist/node' : 'dist/browser',
    lib: {
      formats: target === 'node' ? ['es', 'cjs'] : ['es', 'umd'],
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ReportingSDK',
      fileName: 'reporting-sdk-js',
    },
  },
});
