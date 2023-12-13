import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// TODO: fix node build

const buildTarget = (process.env.BUILD_TARGET || 'browser') as 'browser' | 'node';
console.log('i Building for', buildTarget);

let params;
switch (buildTarget) {
  case 'node':
    params = { build: { target: 'node14', outDir: 'dist/node', lib: { formats: ['es', 'csj'] } } };
    break;

  default:
    params = { build: { target: 'modules', outDir: 'dist/browser', lib: { formats: ['es', 'umd'] } } };
    break;
}

export default defineConfig({
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
