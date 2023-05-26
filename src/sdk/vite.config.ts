import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// TODO: fix node build

const buildTarget = (process.env.BUILD_TARGET || 'browser') as 'browser' | 'node' | 'types';
console.log('i Building for', buildTarget);

let params;
switch (buildTarget) {
  case 'node':
    params = { build: { target: 'node14', outDir: 'dist/node', lib: { formats: ['es', 'csj'] } } };
    break;

  case 'types':
    params = { build: { outDir: 'dist/types', write: false }, plugins: [dts({ outputDir: 'dist/types', copyDtsFiles: true })] };
    break;

  default:
    params = { build: { target: 'modules', outDir: 'dist/browser', lib: { formats: ['es', 'umd'] } } };
    break;
}

export default defineConfig({
  plugins: [
    ...(params.plugins ?? []),
  ],
  build: {
    sourcemap: true,
    ...(params.build ?? {}),
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ezReeportSDK',
      fileName: 'ezreeport-sdk-js',
      ...(params.build?.lib ?? {}),
    },
  },
});
