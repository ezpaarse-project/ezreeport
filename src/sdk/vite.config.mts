import { resolve } from 'node:path';
import { type UserConfig, defineConfig, mergeConfig } from 'vite';

const buildTarget = (process.env.BUILD_TARGET || 'browser') as 'browser' | 'node';
// eslint-disable-next-line no-console
console.log('i Building for', buildTarget);

type LibParams = Exclude<UserConfig['build'], undefined>['lib'];

let params: Partial<UserConfig>;
switch (buildTarget) {
  case 'node':
    params = {
      build: {
        target: 'node14',
        outDir: 'dist/node',
        lib: {
          formats: ['es', 'cjs'],
        } as LibParams,
      },
    };
    break;

  default:
    params = {
      build: {
        target: 'modules',
        outDir: 'dist/browser',
        lib: {
          formats: ['es', 'umd'],
        } as LibParams,
      },
    };
    break;
}

export default defineConfig(
  mergeConfig<UserConfig, UserConfig>(
    {
      build: {
        minify: 'esbuild',
        sourcemap: true,
        lib: {
          entry: resolve(__dirname, 'src/index.ts'),
          name: 'ezReeportSDK',
          fileName: 'ezreeport-sdk-js',
        },
        rollupOptions: {
          external: ['axios'],
          output: {
            globals: {
              axios: 'axios',
            },
          },
        },
      },
    },
    params ?? {},
    true,
  ),
);
